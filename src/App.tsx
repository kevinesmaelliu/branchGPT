import { useState } from 'react'
import './App.css'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useAgentStore } from '@/stores/agentStore'
import { useChatStore } from '@/stores/chatStore'
import { createTextMessage } from '@/types/messages'

function App() {
  const [workspaceName, setWorkspaceName] = useState('')
  const [agentName, setAgentName] = useState('')

  // Workspace store
  const workspaces = useWorkspaceStore(state =>
    Array.from(state.workspaces.values()).sort((a, b) => b.createdAt - a.createdAt)
  )
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)
  const createWorkspace = useWorkspaceStore(state => state.createWorkspace)
  const setActiveWorkspace = useWorkspaceStore(state => state.setActiveWorkspace)

  // Agent store
  const agents = useAgentStore(state => state.agents)
  const createAgent = useAgentStore(state => state.createAgent)
  const workspaceAgentsMap = useAgentStore(state => state.agents)

  // Chat store
  const conversations = useChatStore(state => state.conversations)
  const createConversation = useChatStore(state => state.createConversation)
  const addMessage = useChatStore(state => state.addMessage)

  const handleCreateWorkspace = () => {
    if (!workspaceName.trim()) return
    const id = createWorkspace({
      name: workspaceName,
      description: 'Test workspace'
    })
    setWorkspaceName('')
    console.log('Created workspace:', id)
  }

  const handleCreateAgent = () => {
    if (!agentName.trim() || !activeWorkspaceId) return

    const agentId = createAgent({
      name: agentName,
      workspaceId: activeWorkspaceId,
      model: 'claude-sonnet-4-5-20250929',
      provider: 'anthropic'
    })

    // Create a conversation for the agent
    const conversationId = createConversation(activeWorkspaceId, agentId)

    // Update agent with conversation ID
    useAgentStore.getState().updateAgent(agentId, { conversationId })

    // Add a test message
    addMessage(conversationId, createTextMessage('user', 'Hello, agent!'))

    setAgentName('')
    console.log('Created agent:', agentId)
  }

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId)
  const workspaceAgents = activeWorkspaceId
    ? Array.from(workspaceAgentsMap.values()).filter(agent => agent.workspaceId === activeWorkspaceId)
    : []

  return (
    <main className="app-shell">
      <h1>BranchGPT</h1>
      <p className="subtitle">Multi-Agent AI Orchestration Platform</p>

      <div className="status-grid">
        <div className="status-card">
          <div className="status-label">Workspaces</div>
          <div className="status-value">{workspaces.length}</div>
        </div>
        <div className="status-card">
          <div className="status-label">Agents</div>
          <div className="status-value">{agents.size}</div>
        </div>
        <div className="status-card">
          <div className="status-label">Conversations</div>
          <div className="status-value">{conversations.size}</div>
        </div>
      </div>

      <section className="section">
        <h2>Create Workspace</h2>
        <div className="form-group">
          <input
            type="text"
            value={workspaceName}
            onChange={e => setWorkspaceName(e.target.value)}
            placeholder="Workspace name"
            className="input"
          />
          <button onClick={handleCreateWorkspace} className="button">
            Create Workspace
          </button>
        </div>
      </section>

      {workspaces.length > 0 && (
        <section className="section">
          <h2>Workspaces</h2>
          <div className="workspace-list">
            {workspaces.map(workspace => (
              <div
                key={workspace.id}
                className={`workspace-item ${
                  workspace.id === activeWorkspaceId ? 'active' : ''
                }`}
                onClick={() => setActiveWorkspace(workspace.id)}
              >
                <div className="workspace-name">{workspace.name}</div>
                <div className="workspace-agents">
                  {workspace.agentIds.length} agents
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeWorkspace && (
        <section className="section">
          <h2>Create Agent in "{activeWorkspace.name}"</h2>
          <div className="form-group">
            <input
              type="text"
              value={agentName}
              onChange={e => setAgentName(e.target.value)}
              placeholder="Agent name"
              className="input"
            />
            <button onClick={handleCreateAgent} className="button">
              Create Agent
            </button>
          </div>
        </section>
      )}

      {workspaceAgents.length > 0 && (
        <section className="section">
          <h2>Agents in Workspace</h2>
          <div className="agent-list">
            {workspaceAgents.map(agent => (
              <div key={agent.id} className="agent-item">
                <div
                  className="agent-color"
                  style={{ backgroundColor: agent.metadata?.color }}
                />
                <div className="agent-info">
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-model">
                    {agent.provider} • {agent.model}
                  </div>
                  <div className="agent-status">{agent.status}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="footer">
        <p>
          ✅ Foundation complete: Type system, stores, and persistence layer
          are working!
        </p>
        <p>
          Next steps: UI components (canvas, chat, terminal) and AI provider
          integration
        </p>
      </footer>
    </main>
  )
}

export default App
