// Workspace store for organizing agents into workspaces

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { Workspace, WorkspaceConfig } from '@/types/workspace'

interface WorkspaceState {
  // State
  workspaces: Map<string, Workspace>
  activeWorkspaceId: string | null

  // Actions - Workspace Management
  createWorkspace: (config: WorkspaceConfig) => string
  updateWorkspace: (workspaceId: string, update: Partial<Workspace>) => void
  deleteWorkspace: (workspaceId: string) => void
  setActiveWorkspace: (workspaceId: string | null) => void
  getWorkspace: (workspaceId: string) => Workspace | undefined
  getAllWorkspaces: () => Workspace[]

  // Actions - Agent Management in Workspace
  addAgentToWorkspace: (workspaceId: string, agentId: string) => void
  removeAgentFromWorkspace: (workspaceId: string, agentId: string) => void
  getWorkspaceAgents: (workspaceId: string) => string[]

  // Actions - Utility
  clearAllWorkspaces: () => void
  getWorkspaceCount: () => number
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

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      // Initial state
      workspaces: new Map(),
      activeWorkspaceId: null,

      // Create a new workspace
      createWorkspace: config => {
        const id = crypto.randomUUID()
        const now = Date.now()

        const workspace: Workspace = {
          id,
          name: config.name,
          agentIds: [],
          isolated: config.isolated ?? false,
          createdAt: now,
          updatedAt: now,
          metadata: {
            branch: config.branch,
            path: config.path,
            description: config.description
          }
        }

        set(state => ({
          workspaces: new Map(state.workspaces).set(id, workspace),
          activeWorkspaceId: id
        }))

        return id
      },

      // Update a workspace
      updateWorkspace: (workspaceId, update) => {
        const workspace = get().workspaces.get(workspaceId)
        if (!workspace) return

        const updated = {
          ...workspace,
          ...update,
          updatedAt: Date.now()
        }

        set(state => ({
          workspaces: new Map(state.workspaces).set(workspaceId, updated)
        }))
      },

      // Delete a workspace
      deleteWorkspace: workspaceId => {
        set(state => {
          const newWorkspaces = new Map(state.workspaces)
          newWorkspaces.delete(workspaceId)

          return {
            workspaces: newWorkspaces,
            activeWorkspaceId:
              state.activeWorkspaceId === workspaceId
                ? null
                : state.activeWorkspaceId
          }
        })
      },

      // Set active workspace
      setActiveWorkspace: workspaceId => {
        set({ activeWorkspaceId: workspaceId })
      },

      // Get a workspace by ID
      getWorkspace: workspaceId => {
        return get().workspaces.get(workspaceId)
      },

      // Get all workspaces
      getAllWorkspaces: () => {
        return Array.from(get().workspaces.values()).sort(
          (a, b) => b.createdAt - a.createdAt
        )
      },

      // Add an agent to a workspace
      addAgentToWorkspace: (workspaceId, agentId) => {
        const workspace = get().workspaces.get(workspaceId)
        if (!workspace) return

        // Don't add duplicates
        if (workspace.agentIds.includes(agentId)) return

        const updated = {
          ...workspace,
          agentIds: [...workspace.agentIds, agentId],
          updatedAt: Date.now()
        }

        set(state => ({
          workspaces: new Map(state.workspaces).set(workspaceId, updated)
        }))
      },

      // Remove an agent from a workspace
      removeAgentFromWorkspace: (workspaceId, agentId) => {
        const workspace = get().workspaces.get(workspaceId)
        if (!workspace) return

        const updated = {
          ...workspace,
          agentIds: workspace.agentIds.filter(id => id !== agentId),
          updatedAt: Date.now()
        }

        set(state => ({
          workspaces: new Map(state.workspaces).set(workspaceId, updated)
        }))
      },

      // Get all agent IDs in a workspace
      getWorkspaceAgents: workspaceId => {
        const workspace = get().workspaces.get(workspaceId)
        return workspace?.agentIds ?? []
      },

      // Clear all workspaces
      clearAllWorkspaces: () => {
        set({
          workspaces: new Map(),
          activeWorkspaceId: null
        })
      },

      // Get total workspace count
      getWorkspaceCount: () => {
        return get().workspaces.size
      }
    }),
    {
      name: 'branchgpt-workspace-storage',
      version: 1,
      storage: createJSONStorage(() => indexedDBStorage),
      // Custom serialization to handle Map
      partialize: state => ({
        workspaces: Array.from(state.workspaces.entries()),
        activeWorkspaceId: state.activeWorkspaceId
      }),
      merge: (persistedState: any, currentState) => {
        return {
          ...currentState,
          ...persistedState,
          workspaces: Array.isArray(persistedState?.workspaces)
            ? new Map(persistedState.workspaces as [string, Workspace][])
            : new Map()
        }
      }
    }
  )
)
