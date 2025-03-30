import React, { useState, useEffect } from 'react';
import { Prompt, getPrompts, getDefaultPrompt, createPrompt, updatePrompt, deletePrompt } from '../services/api';

interface PromptEditorProps {
  onSelectPrompt: (promptId: number | undefined) => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ onSelectPrompt }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<number | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  
  const [currentPrompt, setCurrentPrompt] = useState<Prompt>({
    name: '',
    content: '',
    is_default: false
  });
  
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all prompts when the component mounts
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const fetchedPrompts = await getPrompts();
        setPrompts(fetchedPrompts);
        
        // Set the default prompt as selected
        const defaultPrompt = fetchedPrompts.find(p => p.is_default);
        if (defaultPrompt && defaultPrompt.id) {
          setSelectedPromptId(defaultPrompt.id);
          setCurrentPrompt(defaultPrompt);
          onSelectPrompt(defaultPrompt.id);
        }
      } catch (error) {
        console.error('Error fetching prompts:', error);
        setError('Failed to load prompts');
      }
    };
    
    fetchPrompts();
  }, [onSelectPrompt]);
  
  // Handle prompt selection
  const handlePromptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setSelectedPromptId(id);
    
    // Find the selected prompt in the array
    const selected = prompts.find(p => p.id === id);
    if (selected) {
      setCurrentPrompt(selected);
      onSelectPrompt(id);
    }
  };
  
  // Handle editing a prompt
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  // Handle canceling edits
  const handleCancel = () => {
    // Revert to the original prompt
    if (selectedPromptId) {
      const original = prompts.find(p => p.id === selectedPromptId);
      if (original) {
        setCurrentPrompt(original);
      }
    } else {
      setCurrentPrompt({
        name: '',
        content: '',
        is_default: false
      });
    }
    setIsEditing(false);
  };
  
  // Handle creating a new prompt
  const handleNew = () => {
    setSelectedPromptId(undefined);
    setCurrentPrompt({
      name: 'New Prompt',
      content: '{{tweet}}',
      is_default: false
    });
    setIsEditing(true);
  };
  
  // Handle saving a prompt (create or update)
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      let savedPrompt;
      
      if (selectedPromptId) {
        // Update existing prompt
        savedPrompt = await updatePrompt(selectedPromptId, currentPrompt);
      } else {
        // Create new prompt
        savedPrompt = await createPrompt(currentPrompt);
      }
      
      // Update the prompts list
      const updatedPrompts = selectedPromptId 
        ? prompts.map(p => p.id === selectedPromptId ? savedPrompt : p)
        : [...prompts, savedPrompt];
      
      setPrompts(updatedPrompts);
      setSelectedPromptId(savedPrompt.id);
      setCurrentPrompt(savedPrompt);
      setIsEditing(false);
      
      // If this is now the default prompt, update the selected prompt
      if (savedPrompt.is_default && savedPrompt.id) {
        onSelectPrompt(savedPrompt.id);
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      setError('Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle deleting a prompt
  const handleDelete = async () => {
    if (!selectedPromptId || !window.confirm('Are you sure you want to delete this prompt?')) {
      return;
    }
    
    try {
      await deletePrompt(selectedPromptId);
      
      // Remove from the prompts list
      const updatedPrompts = prompts.filter(p => p.id !== selectedPromptId);
      setPrompts(updatedPrompts);
      
      // Reset selection
      const defaultPrompt = updatedPrompts.find(p => p.is_default);
      if (defaultPrompt && defaultPrompt.id) {
        setSelectedPromptId(defaultPrompt.id);
        setCurrentPrompt(defaultPrompt);
        onSelectPrompt(defaultPrompt.id);
      } else if (updatedPrompts.length > 0 && updatedPrompts[0].id) {
        setSelectedPromptId(updatedPrompts[0].id);
        setCurrentPrompt(updatedPrompts[0]);
        onSelectPrompt(updatedPrompts[0].id);
      } else {
        setSelectedPromptId(undefined);
        setCurrentPrompt({
          name: '',
          content: '',
          is_default: false
        });
        onSelectPrompt(undefined);
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      setError('Failed to delete prompt');
    }
  };
  
  // Update the current prompt as the user types
  const handlePromptNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPrompt({
      ...currentPrompt,
      name: e.target.value
    });
  };
  
  const handlePromptContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentPrompt({
      ...currentPrompt,
      content: e.target.value
    });
  };
  
  const handleDefaultChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPrompt({
      ...currentPrompt,
      is_default: e.target.checked
    });
  };
  
  const promptSelectorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    gap: '10px'
  };
  
  const buttonStyle: React.CSSProperties = {
    padding: '5px 10px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    backgroundColor: '#1d9bf0',
    color: 'white',
    marginRight: '8px'
  };
  
  const cancelButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#657786'
  };
  
  const dangerButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#E0245E'
  };
  
  const formGroupStyle: React.CSSProperties = {
    marginBottom: '16px'
  };
  
  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold'
  };
  
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc'
  };
  
  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: '200px',
    fontFamily: 'monospace'
  };
  
  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button 
          style={{ 
            ...buttonStyle, 
            display: 'flex', 
            alignItems: 'center',
            padding: '8px 12px'
          }} 
          onClick={() => setShowEditor(!showEditor)}
        >
          {showEditor ? 'Hide Prompt Editor ▲' : 'Show Prompt Editor ▼'}
        </button>
      </div>
      
      {showEditor && (
        <>
          {error && (
            <div style={{ padding: '10px', backgroundColor: '#ffdddd', color: '#cc0000', borderRadius: '4px', marginBottom: '15px' }}>
              {error}
            </div>
          )}
          
          <div style={promptSelectorStyle}>
            <label htmlFor="promptSelect">Select Prompt:</label>
            <select 
              id="promptSelect" 
              value={selectedPromptId} 
              onChange={handlePromptChange}
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              disabled={isEditing}
            >
              {prompts.map(prompt => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.name} {prompt.is_default ? '(Default)' : ''}
                </option>
              ))}
            </select>
            
            <button 
              style={buttonStyle} 
              onClick={handleNew}
              disabled={isEditing}
            >
              New
            </button>
            
            {selectedPromptId && !isEditing && (
              <>
                <button style={buttonStyle} onClick={handleEdit}>Edit</button>
                <button 
                  style={dangerButtonStyle} 
                  onClick={handleDelete}
                  disabled={currentPrompt.is_default} // Don't allow deleting the default prompt
                >
                  Delete
                </button>
              </>
            )}
          </div>
          
          {isEditing ? (
            <div>
              <div style={formGroupStyle}>
                <label htmlFor="promptName" style={labelStyle}>Name:</label>
                <input
                  id="promptName"
                  type="text"
                  value={currentPrompt.name}
                  onChange={handlePromptNameChange}
                  style={inputStyle}
                  required
                />
              </div>
              
              <div style={formGroupStyle}>
                <label htmlFor="promptContent" style={labelStyle}>Content:</label>
                <textarea
                  id="promptContent"
                  value={currentPrompt.content}
                  onChange={handlePromptContentChange}
                  style={textareaStyle}
                  required
                />
                <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#657786' }}>
                  Use {{tweet}} as a placeholder for the tweet text.
                </div>
              </div>
              
              <div style={formGroupStyle}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={currentPrompt.is_default || false}
                    onChange={handleDefaultChange}
                    style={{ marginRight: '8px' }}
                  />
                  Set as default prompt
                </label>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  style={cancelButtonStyle} 
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  style={buttonStyle} 
                  onClick={handleSave}
                  disabled={isSaving || !currentPrompt.name || !currentPrompt.content}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ marginBottom: '10px', color: '#1d9bf0' }}>
                {currentPrompt.name} {currentPrompt.is_default ? '(Default)' : ''}
              </h3>
              <pre style={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                padding: '15px',
                backgroundColor: '#f5f8fa',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '14px',
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #e1e8ed'
              }}>
                {currentPrompt.content}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PromptEditor;
