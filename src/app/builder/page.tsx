'use client';

import { useEffect, useState } from 'react';
import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas';
import { LeftSidebar, RightSidebar } from '@/components/sidebar';
import { useWorkflowStore } from '@/lib/store/workflowStore';
import {
  Save,
  FolderOpen,
  Download,
  Upload,
  Plus,
  FileText,
} from 'lucide-react';

export default function BuilderPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [workflows, setWorkflows] = useState<Array<{ id: string; name: string }>>([]);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const {
    workflowName,
    setWorkflowName,
    nodes,
    edges,
    viewport,
    workflowId,
    setWorkflowId,
    exportWorkflow,
    importWorkflow,
    clearWorkflow,
  } = useWorkflowStore();

  // Fetch workflows on mount
  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    }
  };

  const saveWorkflow = async () => {
    setIsLoading(true);
    try {
      const payload = {
        name: workflowName,
        nodes,
        edges,
        viewport,
      };

      if (workflowId) {
        // Update existing
        const response = await fetch(`/api/workflows/${workflowId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          alert('Workflow saved!');
        }
      } else {
        // Create new
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          setWorkflowId(data.workflow.id);
          alert('Workflow created!');
          fetchWorkflows();
        }
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkflow = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workflows/${id}`);
      if (response.ok) {
        const data = await response.json();
        const workflow = data.workflow;
        setWorkflowId(workflow.id);
        setWorkflowName(workflow.name);
        useWorkflowStore.setState({
          nodes: workflow.nodes || [],
          edges: workflow.edges || [],
          viewport: workflow.viewport || { x: 0, y: 0, zoom: 1 },
        });
        setShowLoadModal(false);
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const json = exportWorkflow();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        importWorkflow(json);
      };
      reader.readAsText(file);
    }
  };

  const createNew = () => {
    clearWorkflow();
    setWorkflowName('Untitled Workflow');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={createNew}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >
            <Plus size={16} />
            New
          </button>
          <button
            onClick={() => setShowLoadModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >
            <FolderOpen size={16} />
            Load
          </button>
          <button
            onClick={saveWorkflow}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded transition-colors"
          >
            <Save size={16} />
            Save
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >
            <Download size={16} />
            Export
          </button>
          <label className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors cursor-pointer">
            <Upload size={16} />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 relative">
          <WorkflowCanvas />
        </div>
        <RightSidebar />
      </div>

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 w-96">
            <h2 className="text-lg font-semibold text-white mb-4">
              Load Workflow
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {workflows.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No saved workflows
                </p>
              ) : (
                workflows.map((workflow) => (
                  <button
                    key={workflow.id}
                    onClick={() => loadWorkflow(workflow.id)}
                    className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded text-gray-200 transition-colors"
                  >
                    {workflow.name}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowLoadModal(false)}
              className="mt-4 w-full py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
