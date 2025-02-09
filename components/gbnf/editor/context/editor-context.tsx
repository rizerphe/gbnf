import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { generateGBNF } from '../../utils/gbnf-generation';
import { validateConnections } from '../../utils/validation';
import { toast } from 'sonner';
import { useEditorState } from '../state/use-editor-state';
import { useSavedGrammars } from '../state/use-saved-grammars';
import { SavedGrammar, GBNFNode, GBNFEdge } from '../../types';

interface EditorContextType {
  // Dialog States
  exportDialogOpen: boolean;
  commandOpen: boolean;
  gbnfContent: string;
  
  // Actions
  setExportDialogOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  handleExport: () => void;
  handleDownload: () => void;
  handleCopy: () => void;
  
  // Editor State
  nodes: GBNFNode[];
  edges: GBNFEdge[];
  currentId: string | null;
  currentName: string | null;
  isEditingName: boolean;
  selectedNodes: string[];
  setCurrentName: (name: string | null) => void;
  setIsEditingName: (editing: boolean) => void;
  
  // Flow Actions
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: GBNFNode[] | ((nodes: GBNFNode[]) => GBNFNode[])) => void;
  setEdges: (edges: GBNFEdge[] | ((edges: GBNFEdge[]) => GBNFEdge[])) => void;
  setSelectedNodes: (nodes: string[]) => void;
  
  // Grammar Actions
  loadGrammar: (grammar: SavedGrammar) => void;
  saveCurrentGrammar: (currentId: string, currentName: string | null, nodes: GBNFNode[], edges: GBNFEdge[]) => void;
  resetState: () => void;
  handleDelete: (id: string) => void;
  savedGrammars: SavedGrammar[];
}

const EditorContext = createContext<EditorContextType | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, actions] = useEditorState();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [gbnfContent, setGbnfContent] = useState('');
  
  const savedGrammarsHandlers = useSavedGrammars(
    actions.setNodes,
    actions.setEdges,
    actions.setCurrentName,
    actions.setCurrentId
  );

  // Auto-save effect without debouncing
  useEffect(() => {
    if (!state.currentId) return;

    if (state.nodes.length <= 2) {
      // If we're editing an existing grammar and only two nodes are left, delete it
      const existingGrammar = savedGrammarsHandlers.savedGrammars.find(g => g.id === state.currentId);
      if (existingGrammar) {
        savedGrammarsHandlers.handleDelete(state.currentId);
      }
      return;
    }

    savedGrammarsHandlers.saveCurrentGrammar(
      state.currentId,
      state.currentName,
      state.nodes,
      state.edges
    );
  }, [state.nodes, state.edges, state.currentId, state.currentName, savedGrammarsHandlers]);

  const handleExport = useCallback(() => {
    const validation = validateConnections(state.nodes, state.edges);
    if (!validation.valid) {
      toast.error("Grammar is incomplete", {
        description: "Some nodes are not properly connected:",
        action: {
          label: "View Details",
          onClick: () =>
            toast("Unconnected Nodes", {
              description: (
                <pre className="mt-2 whitespace-pre-wrap font-mono text-sm">
                  {validation.unconnectedNodes
                    .map((node) => `• ${node}`)
                    .join("\n")}
                </pre>
              ),
            }),
        },
        duration: 5000,
      });
      return;
    }

    const gbnf = generateGBNF(state.nodes, state.edges);
    setGbnfContent(gbnf);
    setExportDialogOpen(true);
  }, [state.nodes, state.edges]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([gbnfContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = state.currentName
      ? `${state.currentName.toLowerCase().replace(/[^a-z0-9_]/g, "_")}.gbnf`
      : "grammar.gbnf";
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportDialogOpen(false);
  }, [gbnfContent, state.currentName]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(gbnfContent);
    setExportDialogOpen(false);
  }, [gbnfContent]);

  const value: EditorContextType = {
    ...state,
    exportDialogOpen,
    commandOpen,
    gbnfContent,
    setExportDialogOpen,
    setCommandOpen,
    handleExport,
    handleDownload,
    handleCopy,
    setCurrentName: actions.setCurrentName,
    setIsEditingName: actions.setIsEditingName,
    resetState: actions.resetState,
    onNodesChange: actions.onNodesChange,
    onEdgesChange: actions.onEdgesChange,
    onConnect: actions.onConnect,
    setNodes: actions.setNodes,
    setEdges: actions.setEdges,
    setSelectedNodes: actions.setSelectedNodes,
    ...savedGrammarsHandlers,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
} 
