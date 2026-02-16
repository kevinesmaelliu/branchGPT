// Agent store for managing agent lifecycle and actions

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type {
  Agent,
  AgentStatus,
  AgentConfig,
  AgentAction,
  ClarifyingQuestionAction,
  ToolApprovalAction,
  ToolApprovalDecision
} from '@/types/agents'
import { getDefaultModel } from '@/types/agents'

interface AgentState {
  // State
  agents: Map<string, Agent>
  pendingActions: Map<string, AgentAction[]>

  // Actions - Agent Management
  createAgent: (config: AgentConfig) => string
  updateAgent: (agentId: string, update: Partial<Agent>) => void
  updateAgentStatus: (agentId: string, status: AgentStatus) => void
  deleteAgent: (agentId: string) => void
  getAgent: (agentId: string) => Agent | undefined
  getAgentsByWorkspace: (workspaceId: string) => Agent[]

  // Actions - Pending Actions Management
  addPendingAction: (action: AgentAction) => void
  resolvePendingAction: (agentId: string, actionId: string, resolution?: unknown) => void
  getPendingActions: (agentId: string) => AgentAction[]
  getAllPendingActions: () => AgentAction[]
  clearPendingActions: (agentId: string) => void

  // Actions - Utility
  clearAllAgents: () => void
  getAgentCount: () => number
}

// IndexedDB storage
const indexedDBStorage = {
  getItem: async (name: string) => {
    const value = await idbGet(name)
    return value ?? null
  },
  setItem: async (name: string, value: string) => {
    await idbSet(name, value)
  },
  removeItem: async (name: string) => {
    await idbDel(name)
  }
}

// Agent color palette for visual identification
const AGENT_COLORS = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16'  // Lime
]

let colorIndex = 0

function getNextColor(): string {
  const color = AGENT_COLORS[colorIndex % AGENT_COLORS.length]
  colorIndex++
  return color ?? '#8B5CF6'
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      // Initial state
      agents: new Map(),
      pendingActions: new Map(),

      // Create a new agent
      createAgent: config => {
        const id = crypto.randomUUID()
        const now = Date.now()

        const agent: Agent = {
          id,
          name: config.name ?? `Agent ${id.slice(0, 8)}`,
          status: 'idle',
          workspaceId: config.workspaceId,
          conversationId: '', // Will be set when conversation is created
          model: config.model || getDefaultModel(config.provider),
          provider: config.provider,
          createdAt: now,
          updatedAt: now,
          metadata: {
            systemPrompt: config.systemPrompt,
            temperature: config.temperature ?? 0.7,
            maxTokens: config.maxTokens ?? 4096,
            color: config.color ?? getNextColor()
          }
        }

        set(state => ({
          agents: new Map(state.agents).set(id, agent)
        }))

        return id
      },

      // Update an agent
      updateAgent: (agentId, update) => {
        const agent = get().agents.get(agentId)
        if (!agent) return

        const updated = {
          ...agent,
          ...update,
          updatedAt: Date.now()
        }

        set(state => ({
          agents: new Map(state.agents).set(agentId, updated)
        }))
      },

      // Update agent status
      updateAgentStatus: (agentId, status) => {
        const agent = get().agents.get(agentId)
        if (!agent) return

        const updated = {
          ...agent,
          status,
          updatedAt: Date.now()
        }

        set(state => ({
          agents: new Map(state.agents).set(agentId, updated)
        }))
      },

      // Delete an agent
      deleteAgent: agentId => {
        set(state => {
          const newAgents = new Map(state.agents)
          newAgents.delete(agentId)

          const newPendingActions = new Map(state.pendingActions)
          newPendingActions.delete(agentId)

          return {
            agents: newAgents,
            pendingActions: newPendingActions
          }
        })
      },

      // Get an agent by ID
      getAgent: agentId => {
        return get().agents.get(agentId)
      },

      // Get all agents in a workspace
      getAgentsByWorkspace: workspaceId => {
        return Array.from(get().agents.values()).filter(
          agent => agent.workspaceId === workspaceId
        )
      },

      // Add a pending action
      addPendingAction: action => {
        const currentActions = get().pendingActions.get(action.agentId) ?? []

        set(state => ({
          pendingActions: new Map(state.pendingActions).set(action.agentId, [
            ...currentActions,
            action
          ])
        }))

        // Update agent status
        get().updateAgentStatus(action.agentId, 'waiting_approval')
      },

      // Resolve a pending action
      resolvePendingAction: (agentId, actionId, resolution) => {
        const actions = get().pendingActions.get(agentId) ?? []
        const action = actions.find(a => a.id === actionId)

        if (!action) return

        // Update action status
        const updatedAction = {
          ...action,
          status: resolution ? ('approved' as const) : ('denied' as const)
        }

        // Add resolution data
        if (action.type === 'tool_approval' && resolution) {
          (updatedAction as ToolApprovalAction).decision = resolution as ToolApprovalDecision
        } else if (action.type === 'clarifying_question' && resolution) {
          (updatedAction as ClarifyingQuestionAction).response = resolution as string | string[]
        }

        // Remove from pending actions
        const updatedActions = actions.filter(a => a.id !== actionId)

        set(state => ({
          pendingActions: new Map(state.pendingActions).set(agentId, updatedActions)
        }))

        // If no more pending actions, update agent status
        if (updatedActions.length === 0) {
          get().updateAgentStatus(agentId, 'idle')
        }
      },

      // Get pending actions for an agent
      getPendingActions: agentId => {
        return get().pendingActions.get(agentId) ?? []
      },

      // Get all pending actions across all agents
      getAllPendingActions: () => {
        const allActions: AgentAction[] = []
        for (const actions of get().pendingActions.values()) {
          allActions.push(...actions)
        }
        return allActions.sort((a, b) => a.timestamp - b.timestamp)
      },

      // Clear all pending actions for an agent
      clearPendingActions: agentId => {
        set(state => {
          const newPendingActions = new Map(state.pendingActions)
          newPendingActions.delete(agentId)
          return { pendingActions: newPendingActions }
        })

        get().updateAgentStatus(agentId, 'idle')
      },

      // Clear all agents
      clearAllAgents: () => {
        set({
          agents: new Map(),
          pendingActions: new Map()
        })
      },

      // Get total agent count
      getAgentCount: () => {
        return get().agents.size
      }
    }),
    {
      name: 'branchgpt-agent-storage',
      version: 1,
      storage: createJSONStorage(() => indexedDBStorage),
      // Custom serialization to handle Map
      partialize: state => ({
        agents: Array.from(state.agents.entries()),
        pendingActions: Array.from(state.pendingActions.entries())
      }),
      merge: (persistedState: any, currentState) => {
        return {
          ...currentState,
          ...persistedState,
          agents: Array.isArray(persistedState?.agents)
            ? new Map(persistedState.agents as [string, Agent][])
            : new Map(),
          pendingActions: Array.isArray(persistedState?.pendingActions)
            ? new Map(persistedState.pendingActions as [string, AgentAction[]][])
            : new Map()
        }
      }
    }
  )
)
