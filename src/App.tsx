import { useState, useMemo } from 'react'
import './App.css'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useAgentStore } from '@/stores/agentStore'
import { useChatStore } from '@/stores/chatStore'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { Button } from '@/components/common/Button'

function App() {
  const [workspaceName, setWorkspaceName] = useState('')
  const [agentName, setAgentName] = useState('')
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false)
  const [showAgentForm, setShowAgentForm] = useState(false)

  // Workspace store - use shallow comparison for Maps
  const workspacesMap = useWorkspaceStore(state => state.workspaces)
  const workspaces = useMemo(
    () => Array.from(workspacesMap.values()).sort((a, b) => b.createdAt - a.createdAt),
    [workspacesMap]
  )
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId)
  const createWorkspace = useWorkspaceStore(state => state.createWorkspace)
  const setActiveWorkspace = useWorkspaceStore(state => state.setActiveWorkspace)

  // Agent store
  const agentsMap = useAgentStore(state => state.agents)
  const createAgent = useAgentStore(state => state.createAgent)

  // Chat store
  const createConversation = useChatStore(state => state.createConversation)
  const setActiveConversation = useChatStore(state => state.setActiveConversation)

  const handleCreateWorkspace = () => {
    if (!workspaceName.trim()) return
    const id = createWorkspace({
      name: workspaceName,
      description: 'Test workspace'
    })
    setWorkspaceName('')
    setShowWorkspaceForm(false)
    setActiveWorkspace(id)
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

    // Set as active conversation
    setActiveConversation(conversationId)

    setAgentName('')
    setShowAgentForm(false)
    console.log('Created agent:', agentId)
  }

  const activeWorkspace = useMemo(
    () => workspaces.find(w => w.id === activeWorkspaceId),
    [workspaces, activeWorkspaceId]
  )

  const workspaceAgents = useMemo(
    () =>
      activeWorkspaceId
        ? Array.from(agentsMap.values()).filter(agent => agent.workspaceId === activeWorkspaceId)
        : [],
    [agentsMap, activeWorkspaceId]
  )

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">BranchGPT</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">AI Orchestration</p>
        </div>

        {/* Workspaces Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
              Workspaces
            </h3>

            {showWorkspaceForm ? (
              <div className="space-y-2 mb-4">
                <input
                  type="text"
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                  placeholder="Workspace name"
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateWorkspace}
                    disabled={!workspaceName.trim()}
                  >
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setShowWorkspaceForm(false)
                      setWorkspaceName('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" onClick={() => setShowWorkspaceForm(true)} className="w-full mb-4">
                + New Workspace
              </Button>
            )}

            <div className="space-y-2">
              {workspaces.map(workspace => (
                <div
                  key={workspace.id}
                  onClick={() => setActiveWorkspace(workspace.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    workspace.id === activeWorkspaceId
                      ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{workspace.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{workspace.agentIds.length} agents</p>
                </div>
              ))}
            </div>
          </div>

          {/* Agents Section */}
          {activeWorkspace && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                Agents
              </h3>

              {showAgentForm ? (
                <div className="space-y-2 mb-4">
                  <input
                    type="text"
                    value={agentName}
                    onChange={e => setAgentName(e.target.value)}
                    placeholder="Agent name"
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateAgent}
                      disabled={!agentName.trim()}
                    >
                      Create
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setShowAgentForm(false)
                        setAgentName('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" onClick={() => setShowAgentForm(true)} className="w-full mb-4">
                  + New Agent
                </Button>
              )}

              <div className="space-y-2">
                {workspaceAgents.map(agent => (
                  <div
                    key={agent.id}
                    className="p-2 rounded bg-gray-100 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: agent.metadata?.color || '#999' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {agent.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {agent.model}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <ChatContainer />
      </div>
    </div>
  )
}

export default App
