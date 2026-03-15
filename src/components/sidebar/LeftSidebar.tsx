'use client';

import { useState } from 'react';
import {
  Type,
  Image,
  Video,
  Bot,
  Crop,
  Film,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useWorkflowStore } from '@/lib/store/workflowStore';

interface NodeButton {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const nodeButtons: NodeButton[] = [
  {
    type: 'textNode',
    label: 'Text',
    icon: <Type size={20} />,
    description: 'Text input for prompts and messages',
  },
  {
    type: 'uploadImageNode',
    label: 'Upload Image',
    icon: <Image size={20} />,
    description: 'Upload JPG, PNG, WEBP, GIF',
  },
  {
    type: 'uploadVideoNode',
    label: 'Upload Video',
    icon: <Video size={20} />,
    description: 'Upload MP4, MOV, WEBM, M4V',
  },
  {
    type: 'llmNode',
    label: 'LLM',
    icon: <Bot size={20} />,
    description: 'AI prompt enhancer',
  },

  // ⭐ ADD THIS NODE
 

  {
    type: 'cropImageNode',
    label: 'Crop Image',
    icon: <Crop size={20} />,
    description: 'Crop images with percentages',
  },
  {
    type: 'extractFrameNode',
    label: 'Extract Frame',
    icon: <Film size={20} />,
    description: 'Extract frames from video',
  },
];
export function LeftSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const addNode = useWorkflowStore((state) => state.addNode);

  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleClick = (nodeType: string) => {
    // Add node at center of viewport
    addNode(nodeType, { x: 250, y: 250 });
  };

  return (
    <div
      className={`
        flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300
        ${isCollapsed ? 'w-12' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-gray-200">Nodes</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Node Buttons */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {nodeButtons.map((button) => (
          <div
            key={button.type}
            draggable
            onDragStart={(e) => handleDragStart(e, button.type)}
            onClick={() => handleClick(button.type)}
            className={`
              group flex items-center gap-3 p-3 rounded-lg cursor-pointer
              bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500
              transition-all duration-200
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={button.label}
          >
            <span className="text-purple-400 group-hover:text-purple-300">
              {button.icon}
            </span>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {button.label}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {button.description}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            Drag nodes to canvas or click to add
          </p>
        </div>
      )}
    </div>
  );
}
