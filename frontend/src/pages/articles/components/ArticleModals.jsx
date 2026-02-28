// components/ArticleModals.jsx
import React, { useState, useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { updateArticle } from "../../../services/articleService";

const ArticleModals = ({
  // Props for different modal types
  type, // 'delete', 'publish', 'edit'
  modalData,
  setModalData,
  onConfirm,
  isConfirming,
  articles,
  setArticles,
  setFiltered,
  token,
  currentUserId,
  error,
  setError
}) => {
  // ============ EDIT MODAL SPECIFIC STATE ============
  const [tagsInput, setTagsInput] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTitleError, setEditTitleError] = useState("");
  const [editBodyError, setEditBodyError] = useState("");
  const [editTagsError, setEditTagsError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // ============ EDIT MODAL AUTOSAVE STATE ============
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState("");
  const autosaveTimerRef = useRef(null);
  const hasChangesRef = useRef(false);
  
  // ============ QUILL ============
  const editQuillRef = useRef(null);
  const editQuillInstance = useRef(null);

  // ============ INITIALIZE TAGS WHEN EDIT MODAL OPENS ============
  useEffect(() => {
    if (type === 'edit' && modalData) {
      // Convert tags array to comma-separated string
      if (modalData.tags && Array.isArray(modalData.tags)) {
        setTagsInput(modalData.tags.join(", "));
      } else if (modalData.tags && typeof modalData.tags === 'string') {
        setTagsInput(modalData.tags);
      } else {
        setTagsInput("");
      }
      
      // Set edit body
      setEditBody(modalData.body || "");
      
      // Reset errors when opening new article
      setEditTitleError("");
      setEditBodyError("");
      setEditTagsError("");
    }
  }, [modalData, type]);

  // ============ HELPER FUNCTIONS ============
  const getBodyPreview = (htmlContent, wordCount = 8) => {
    if (!htmlContent) return "No content";
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    const words = textContent.trim().split(/\s+/);
    const preview = words.slice(0, wordCount).join(' ');
    return words.length > wordCount ? preview + '...' : preview;
  };

  // ============ EDIT MODAL VALIDATION ============
  const validateEditFields = () => {
    let isValid = true;
    setEditTitleError("");
    setEditBodyError("");
    setEditTagsError("");
    
    if (!modalData.title.trim()) {
      setEditTitleError("Title is required.");
      isValid = false;
    } else if (modalData.title.trim().length < 3) {
      setEditTitleError("Title must be at least 3 characters long.");
      isValid = false;
    } else if (modalData.title.trim().length > 200) {
      setEditTitleError("Title must be less than 200 characters.");
      isValid = false;
    }
    
    const bodyContent = editQuillInstance.current?.root?.innerHTML || "";
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = bodyContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    
    if (!textContent.trim()) {
      setEditBodyError("Content cannot be empty.");
      isValid = false;
    } else if (textContent.trim().length < 10) {
      setEditBodyError("Content must be at least 10 characters long.");
      isValid = false;
    } else if (textContent.trim().length > 50000) {
      setEditBodyError("Content is too long. Maximum 50000 characters.");
      isValid = false;
    }
    
    if (!tagsInput || tagsInput.trim() === "") {
      setEditTagsError("At least one tag is required.");
      isValid = false;
    } else {
      const trimmedTags = tagsInput.trim();
      const tags = trimmedTags.split(',').map(t => t.trim()).filter(t => t !== "");
      
      if (tags.length === 0) {
        setEditTagsError("At least one valid tag is required.");
        isValid = false;
      } else {
        if (tags.length > 10) {
          setEditTagsError("Maximum 10 tags allowed.");
          isValid = false;
        }
        
        for (const tag of tags) {
          if (tag.length < 2) {
            setEditTagsError("Each tag must be at least 2 characters long.");
            isValid = false;
            break;
          }
          if (tag.length > 30) {
            setEditTagsError("Each tag must be less than 30 characters.");
            isValid = false;
            break;
          }
          if (!/^[a-zA-Z0-9-]+$/.test(tag)) {
            setEditTagsError("Tags can only contain letters, numbers, and hyphens.");
            isValid = false;
            break;
          }
        }
        
        if (isValid) {
          const uniqueTags = new Set(tags);
          if (uniqueTags.size !== tags.length) {
            setEditTagsError("Duplicate tags are not allowed.");
            isValid = false;
          }
        }
      }
    }
    
    if (modalData.authorId !== currentUserId) {
      setError("You don't have permission to edit this article.");
      isValid = false;
    }
    
    return isValid;
  };

  // ============ EDIT MODAL AUTOSAVE ============
  const autosaveEditToDB = async () => {
    if (!modalData || !hasChangesRef.current || isAutoSaving || isUpdating) return;
    
    if (!modalData.title.trim()) {
      setAutosaveStatus("Title required for save");
      setTimeout(() => setAutosaveStatus(""), 3000);
      return;
    }
    
    const bodyContent = editQuillInstance.current?.root?.innerHTML || "";
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = bodyContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    
    if (!textContent.trim()) {
      setAutosaveStatus("Content required for save");
      setTimeout(() => setAutosaveStatus(""), 3000);
      return;
    }
    
    if (modalData.authorId !== currentUserId) {
      return;
    }
    
    setIsAutoSaving(true);
    setAutosaveStatus("Auto-saving...");
    
    try {
      const updatedData = {
        title: modalData.title.trim(),
        body: bodyContent,
        tags: tagsInput
      };
      
      const updatedArticle = await updateArticle(modalData.id, updatedData, token);
      
      const normalizedArticle = {
        ...updatedArticle,
        tags: typeof updatedArticle.tags === "string" 
          ? updatedArticle.tags.split(",").map(t => t.trim()).filter(t => t)
          : updatedArticle.tags || [],
        authorName: updatedArticle.authorName || modalData.authorName || "Unknown",
        authorId: updatedArticle.authorId !== undefined ? Number(updatedArticle.authorId) : modalData.authorId,
        bodyPreview: getBodyPreview(bodyContent, 8)
      };
      
      setArticles(prev => prev.map(a => a.id === modalData.id ? normalizedArticle : a));
      setFiltered(prev => prev.map(a => a.id === modalData.id ? normalizedArticle : a));
      
      // Update the modal data
      setModalData(normalizedArticle);
      
      setLastAutoSave(new Date());
      setAutosaveStatus("Auto-saved");
      hasChangesRef.current = false;
      
      setTimeout(() => setAutosaveStatus(""), 3000);
    } catch (err) {
      console.error("Autosave error:", err);
      setAutosaveStatus("Auto-save failed");
      setTimeout(() => setAutosaveStatus(""), 3000);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Track changes
  useEffect(() => {
    if (modalData && type === 'edit') {
      hasChangesRef.current = true;
    }
  }, [modalData?.title, tagsInput]);

  // Track Quill changes
  useEffect(() => {
    if (editQuillInstance.current && type === 'edit') {
      const textChangeHandler = () => {
        hasChangesRef.current = true;
      };
      editQuillInstance.current.on('text-change', textChangeHandler);
      
      return () => {
        if (editQuillInstance.current) {
          editQuillInstance.current.off('text-change', textChangeHandler);
        }
      };
    }
  }, [editQuillInstance.current, type]);

  // Autosave timer
  useEffect(() => {
    if (type !== 'edit') return;
    
    if (autosaveTimerRef.current) {
      clearInterval(autosaveTimerRef.current);
    }
    
    if (modalData) {
      autosaveTimerRef.current = setInterval(() => {
        autosaveEditToDB();
      }, 30000);
    }
    
    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
      }
    };
  }, [modalData, modalData?.title, tagsInput, type]);

  // Initialize Quill
// ============ INITIALIZE QUILL WHEN EDIT MODAL OPENS ============
useEffect(() => {
  if (type === 'edit' && modalData && editQuillRef.current) {
    setTimeout(() => {
      if (!editQuillInstance.current) {
        editQuillInstance.current = new Quill(editQuillRef.current, {
          theme: "snow",
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, 4, 5, 6, false] }],
              [{ font: [] }],
              [{ size: [] }],
              ["bold", "italic", "underline", "strike"],
              [{ color: [] }, { background: [] }],
              [{ script: "sub" }, { script: "super" }],
              [{ list: "ordered" }, { list: "bullet" }],
              [{ indent: "-1" }, { indent: "+1" }],
              [{ direction: "rtl" }],
              [{ align: [] }],
              ["blockquote", "code-block"],
              ["clean"],
            ],
          },
        });
      }

      if (editQuillInstance.current) {
        // Clear first
        editQuillInstance.current.root.innerHTML = "";
        // Set content directly from modalData.body
        editQuillInstance.current.root.innerHTML = modalData.body || "";
        console.log("Quill content set from modalData.body:", modalData.body);
      }
    }, 100);
  }
}, [modalData, type]); // Remove editBody dependency
  // Clean up
  useEffect(() => {
    if (!modalData && editQuillInstance.current) {
      editQuillInstance.current = null;
    }
  }, [modalData]);

  // ============ EDIT MODAL SAVE ============
  const handleSaveEdit = async () => {
    setError("");
    
    if (!validateEditFields()) {
      return;
    }
    
    setIsUpdating(true);
    try {
      const bodyContent = editQuillInstance.current?.root?.innerHTML || "";
      
      const updatedData = {
        title: modalData.title.trim(),
        body: bodyContent,
        tags: tagsInput
      };
      
      const updatedArticle = await updateArticle(modalData.id, updatedData, token);
      
      const normalizedArticle = {
        ...updatedArticle,
        tags: typeof updatedArticle.tags === "string" 
          ? updatedArticle.tags.split(",").map(t => t.trim()).filter(t => t)
          : updatedArticle.tags || [],
        authorName: updatedArticle.authorName || modalData.authorName || "Unknown",
        authorId: updatedArticle.authorId !== undefined ? Number(updatedArticle.authorId) : modalData.authorId,
        bodyPreview: getBodyPreview(bodyContent, 8)
      };
      
      setArticles(prev => prev.map(a => a.id === modalData.id ? normalizedArticle : a));
      setFiltered(prev => prev.map(a => a.id === modalData.id ? normalizedArticle : a));
      
      setModalData(null);
      setError("");
      hasChangesRef.current = false;
      
      if (editQuillInstance.current) {
        editQuillInstance.current.root.innerHTML = "";
      }
    } catch (err) {
      console.error("Update error:", err);
      setError(err.response?.data?.message || "Failed to update article");
    } finally {
      setIsUpdating(false);
    }
  };

  const AutosaveIndicator = () => (
    <div className="autosave-indicator">
      {isAutoSaving && (
        <span className="autosave-status saving">
          <span className="spinner-small"></span> Auto-saving...
        </span>
      )}
      {!isAutoSaving && autosaveStatus && (
        <span className={`autosave-status ${autosaveStatus.includes('failed') ? 'error' : 'success'}`}>
          {autosaveStatus}
        </span>
      )}
      {lastAutoSave && !isAutoSaving && !autosaveStatus && (
        <span className="last-saved">
          Last saved: {lastAutoSave.toLocaleTimeString()}
        </span>
      )}
    </div>
  );

  // ============ RENDER DIFFERENT MODAL TYPES ============
  
  // Delete Modal
  if (type === 'delete') {
    return (
      <div className="modal-overlay">
        <div className="modal small">
          <h3>Delete Article</h3>
          
          <div className="modal-content">
            <p>Are you sure you want to delete "<strong>{modalData?.title}</strong>"?</p>
            <p className="warning-text">This action cannot be undone. The article will be permanently removed.</p>
          </div>
          
          <div className="modal-actions">
            <button 
              onClick={() => setModalData(null)}
              disabled={isConfirming}
            >
              Cancel
            </button>
            <button 
              className="danger" 
              onClick={() => onConfirm(modalData)}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <span className="spinner-small"></span>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Publish/Unpublish Modal
  if (type === 'publish') {
    return (
      <div className="modal-overlay">
        <div className="modal small">
          <h3>{modalData?.published_status === 1 ? "Unpublish Article" : "Publish Article"}</h3>
          
          <div className="modal-content">
            <p>
              {modalData?.published_status === 1 
                ? `Are you sure you want to unpublish "${modalData?.title}"?` 
                : `Are you sure you want to publish "${modalData?.title}"?`}
            </p>
            <p className="info-text">
              {modalData?.published_status === 1 
                ? "Unpublished articles will not be visible to readers." 
                : "Published articles will be visible to all readers."}
            </p>
          </div>
          
          <div className="modal-actions">
            <button 
              onClick={() => setModalData(null)}
              disabled={isConfirming}
            >
              Cancel
            </button>
            <button 
              className="primary" 
              onClick={() => onConfirm(modalData)}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <span className="spinner-small"></span>
                  {modalData?.published_status === 1 ? 'Unpublishing...' : 'Publishing...'}
                </>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit Modal
  if (type === 'edit') {
    return (
      <div className="modal-overlay ">
        <div className="modal split-layout">
          <div className="modal-header">
            <h2>Edit Article</h2>
            <AutosaveIndicator />
            {error && <p className="error">{error}</p>}
          </div>
          
          <div className="modal-body">
            <div className="modal-sidebar">
              <div className="form-group">
                <label>Title</label>
                <input 
                  placeholder="Enter article title" 
                  value={modalData?.title || ""} 
                  onChange={e => {
                    setModalData({ ...modalData, title: e.target.value });
                    setEditTitleError("");
                    hasChangesRef.current = true;
                  }} 
                  className={editTitleError ? "error-input" : ""}
                  disabled={isUpdating || isAutoSaving}
                />
                {editTitleError && <small className="error-text">{editTitleError}</small>}
              </div>
              
              <div className="form-group">
                <label>Tags</label>
                <textarea 
                  placeholder="Enter tags separated by commas (e.g., react, javascript, tutorial)" 
                  value={tagsInput} 
                  onChange={e => {
                    setTagsInput(e.target.value);
                    setEditTagsError("");
                    hasChangesRef.current = true;
                  }} 
                  rows="4"
                  className={editTagsError ? "error-input" : ""}
                  disabled={isUpdating || isAutoSaving}
                />
                {editTagsError && <small className="error-text">{editTagsError}</small>}
              </div>
              
              <div className="editor-tip">
                <span className="tip-icon">💡</span>
                <p>Use the toolbar above to format your content.</p>
              </div>
            </div>
            
            <div className="modal-main">
              <div ref={editQuillRef} className="quill-editor-container"></div>
              {editBodyError && <small className="error-text">{editBodyError}</small>}
            </div>
          </div>
          
          <div className="modal-actions">
            <button 
              onClick={() => {
                setModalData(null);
                setEditTitleError("");
                setEditBodyError("");
                setEditTagsError("");
                hasChangesRef.current = false;
              }}
              disabled={isUpdating || isAutoSaving}
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveEdit} 
              className="primary"
              disabled={isUpdating || isAutoSaving}
            >
              {isUpdating ? (
                <>
                  <span className="spinner-small"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ArticleModals;