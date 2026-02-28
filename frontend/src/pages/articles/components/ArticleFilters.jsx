// components/ArticleFilters.jsx
import React, { useState, useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { createArticle, updateArticle } from "../../../services/articleService";

const ArticleFilters = ({ articles, setFiltered, setError, token, currentUserId }) => {
  // ============ FILTER STATE ============
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // ============ CREATE MODAL STATE ============
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: "", body: "", tags: "" });
  const [titleError, setTitleError] = useState("");
  const [bodyError, setBodyError] = useState("");
  const [tagsError, setTagsError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // ============ AUTOSAVE STATE ============
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState("");
  const autosaveTimerRef = useRef(null);
  const hasChangesRef = useRef(false);
  const createArticleIdRef = useRef(null);
  
  // ============ QUILL ============
  const createQuillRef = useRef(null);
  const createQuillInstance = useRef(null);

  // ============ FILTER LOGIC ============
  useEffect(() => {
    let result = [...articles];
    
    if (search) {
      result = result.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
    }
    
    if (selectedTag !== "All") {
      result = result.filter(a => a.tags.includes(selectedTag));
    }
    
    if (statusFilter === "Published") {
      result = result.filter(a => a.published_status === 1);
    } else if (statusFilter === "Draft") {
      result = result.filter(a => a.published_status === 0);
    }
    
    setFiltered(result);
  }, [search, selectedTag, statusFilter, articles, setFiltered]);

  const allTags = ["All", ...new Set(articles.flatMap(a => a.tags))];

  // ============ CREATE MODAL LOGIC ============
  const getBodyPreview = (htmlContent, wordCount = 8) => {
    if (!htmlContent) return "No content";
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    const words = textContent.trim().split(/\s+/);
    const preview = words.slice(0, wordCount).join(' ');
    return words.length > wordCount ? preview + '...' : preview;
  };

  const validateCreateFields = () => {
    let isValid = true;
    setTitleError("");
    setBodyError("");
    setTagsError("");
    
    if (!formData.title.trim()) {
      setTitleError("Title is required.");
      isValid = false;
    } else if (formData.title.trim().length < 3) {
      setTitleError("Title must be at least 3 characters long.");
      isValid = false;
    } else if (formData.title.trim().length > 200) {
      setTitleError("Title must be less than 200 characters.");
      isValid = false;
    }
    
    const bodyContent = createQuillInstance.current?.root?.innerHTML || "";
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = bodyContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    
    if (!textContent.trim()) {
      setBodyError("Content cannot be empty.");
      isValid = false;
    } else if (textContent.trim().length < 10) {
      setBodyError("Content must be at least 10 characters long.");
      isValid = false;
    } else if (textContent.trim().length > 50000) {
      setBodyError("Content is too long. Maximum 50000 characters.");
      isValid = false;
    }
    
    if (!formData.tags || formData.tags.trim() === "") {
      setTagsError("At least one tag is required.");
      isValid = false;
    } else {
      const trimmedTags = formData.tags.trim();
      const tags = trimmedTags.split(',').map(t => t.trim()).filter(t => t !== "");
      
      if (tags.length === 0) {
        setTagsError("At least one valid tag is required.");
        isValid = false;
      } else {
        if (tags.length > 10) {
          setTagsError("Maximum 10 tags allowed.");
          isValid = false;
        }
        
        for (const tag of tags) {
          if (tag.length < 2) {
            setTagsError("Each tag must be at least 2 characters long.");
            isValid = false;
            break;
          }
          if (tag.length > 30) {
            setTagsError("Each tag must be less than 30 characters.");
            isValid = false;
            break;
          }
          if (!/^[a-zA-Z0-9-]+$/.test(tag)) {
            setTagsError("Tags can only contain letters, numbers, and hyphens.");
            isValid = false;
            break;
          }
        }
        
        if (isValid) {
          const uniqueTags = new Set(tags);
          if (uniqueTags.size !== tags.length) {
            setTagsError("Duplicate tags are not allowed.");
            isValid = false;
          }
        }
      }
    }
    
    return isValid;
  };

  // ============ AUTOSAVE LOGIC ============
  const autosaveCreateToDB = async () => {
    if (!showModal || !hasChangesRef.current || isAutoSaving || isCreating) return;
    
    if (!formData.title.trim()) {
      setAutosaveStatus("Title required for save");
      setTimeout(() => setAutosaveStatus(""), 3000);
      return;
    }
    
    const bodyContent = createQuillInstance.current?.root?.innerHTML || "";
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = bodyContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    
    if (!textContent.trim()) {
      setAutosaveStatus("Content required for save");
      setTimeout(() => setAutosaveStatus(""), 3000);
      return;
    }
    
    setIsAutoSaving(true);
    setAutosaveStatus("Auto-saving...");
    
    try {
      const newArticleData = {
        title: formData.title.trim(),
        body: bodyContent,
        tags: formData.tags
      };
      
      let createdArticle;
      
      if (createArticleIdRef.current) {
        createdArticle = await updateArticle(createArticleIdRef.current, newArticleData, token);
        setAutosaveStatus("Auto-saved (updated)");
      } else {
        createdArticle = await createArticle(newArticleData, token);
        createArticleIdRef.current = createdArticle.id;
        setAutosaveStatus("Auto-saved (created)");
      }
      
      const currentUserName = localStorage.getItem("userName") || "Unknown";
      
      const normalizedArticle = {
        ...createdArticle,
        tags: typeof createdArticle.tags === "string" 
          ? createdArticle.tags.split(",").map(t => t.trim()).filter(t => t)
          : createdArticle.tags || [],
        authorName: createdArticle.authorName || currentUserName,
        authorId: createdArticle.authorId !== undefined ? Number(createdArticle.authorId) : currentUserId,
        bodyPreview: getBodyPreview(bodyContent, 8)
      };
      
      // This would need to update articles - but we'll pass this up via props
      // For now, we'll just log it
      console.log("Article saved:", normalizedArticle);
      
      setLastAutoSave(new Date());
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
    if (showModal) {
      createArticleIdRef.current = null;
      hasChangesRef.current = true;
    }
  }, [showModal]);

  // Track Quill changes
  useEffect(() => {
    if (createQuillInstance.current) {
      const textChangeHandler = () => {
        hasChangesRef.current = true;
      };
      createQuillInstance.current.on('text-change', textChangeHandler);
      
      return () => {
        if (createQuillInstance.current) {
          createQuillInstance.current.off('text-change', textChangeHandler);
        }
      };
    }
  }, [createQuillInstance.current]);

  // Autosave timer
  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearInterval(autosaveTimerRef.current);
    }
    
    if (showModal) {
      autosaveTimerRef.current = setInterval(() => {
        autosaveCreateToDB();
      }, 30000);
    }
    
    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
      }
    };
  }, [showModal, formData.title, formData.tags]);

  // Initialize Quill
  useEffect(() => {
    if (showModal && createQuillRef.current) {
      setTimeout(() => {
        if (!createQuillInstance.current) {
          createQuillInstance.current = new Quill(createQuillRef.current, {
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
        createQuillInstance.current.root.innerHTML = "";
        setBodyError("");
      }, 100);
    }
  }, [showModal]);

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError("");
    
    if (!validateCreateFields()) {
      return;
    }
    
    setIsCreating(true);
    try {
      const bodyContent = createQuillInstance.current?.root?.innerHTML || "";
      
      const newArticleData = {
        title: formData.title.trim(),
        body: bodyContent,
        tags: formData.tags
      };
      
      let createdArticle;
      
      if (createArticleIdRef.current) {
        createdArticle = await updateArticle(createArticleIdRef.current, newArticleData, token);
      } else {
        createdArticle = await createArticle(newArticleData, token);
      }
      
      const currentUserName = localStorage.getItem("userName") || "Unknown";
      
      const normalizedArticle = {
        ...createdArticle,
        tags: typeof createdArticle.tags === "string" 
          ? createdArticle.tags.split(",").map(t => t.trim()).filter(t => t)
          : createdArticle.tags || [],
        authorName: createdArticle.authorName || currentUserName,
        authorId: createdArticle.authorId !== undefined ? Number(createdArticle.authorId) : currentUserId,
        bodyPreview: getBodyPreview(bodyContent, 8)
      };
      
      // Update articles - would need to be passed up
      console.log("Article created:", normalizedArticle);
      
      setFormData({ title: "", body: "", tags: "" });
      setShowModal(false);
      setTitleError("");
      setBodyError("");
      setTagsError("");
      hasChangesRef.current = false;
      createArticleIdRef.current = null;
      
      if (createQuillInstance.current) {
        createQuillInstance.current.root.innerHTML = "";
      }
    } catch (err) {
      console.error("Create error:", err);
      setError(err.response?.data?.message || "Failed to create article");
    } finally {
      setIsCreating(false);
    }
  };

  // Clean up
  useEffect(() => {
    if (!showModal && createQuillInstance.current) {
      createQuillInstance.current = null;
      createArticleIdRef.current = null;
    }
  }, [showModal]);

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

  return (
    <>
      <div className="articles-header">
        <h1>My Articles</h1>
        <div className="filters-section">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search by title..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          
          <select 
            className="filter-select"
            value={selectedTag} 
            onChange={e => setSelectedTag(e.target.value)}
          >
            {allTags.map(tag => <option key={tag}>{tag}</option>)}
          </select>

          <select 
            className="filter-select"
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>

          <button className="create-btn" onClick={() => setShowModal(true)}>
            <span className="btn-icon">+</span> Create Article
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal split-layout">
            <div className="modal-header">
              <h2>Create Article</h2>
              <AutosaveIndicator />
            </div>
            
            <div className="modal-body">
              <div className="modal-sidebar">
                <div className="form-group">
                  <label>Title</label>
                  <input 
                    type="text" 
                    placeholder="Enter article title" 
                    value={formData.title} 
                    onChange={e => {
                      setFormData({ ...formData, title: e.target.value });
                      setTitleError("");
                      hasChangesRef.current = true;
                    }} 
                    className={titleError ? "error-input" : ""}
                    disabled={isCreating || isAutoSaving}
                  />
                  {titleError && <small className="error-text">{titleError}</small>}
                </div>
                
                <div className="form-group">
                  <label>Tags</label>
                  <input 
                    type="text" 
                    placeholder="Enter tags separated by commas (e.g., react, javascript, tutorial)" 
                    value={formData.tags} 
                    onChange={e => {
                      setFormData({ ...formData, tags: e.target.value });
                      setTagsError("");
                      hasChangesRef.current = true;
                    }} 
                    className={tagsError ? "error-input" : ""}
                    disabled={isCreating || isAutoSaving}
                  />
                  {tagsError && <small className="error-text">{tagsError}</small>}
                </div>
                
                <div className="editor-tip">
                  <span className="tip-icon">💡</span>
                  <p>Use the toolbar above to format your content.</p>
                </div>
              </div>
              
              <div className="modal-main">
                <div ref={createQuillRef} className="quill-editor-container"></div>
                {bodyError && <small className="error-text">{bodyError}</small>}
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                type="button" 
                onClick={() => {
                  setShowModal(false);
                  setTitleError("");
                  setBodyError("");
                  setTagsError("");
                  setFormData({ title: "", body: "", tags: "" });
                  hasChangesRef.current = false;
                  createArticleIdRef.current = null;
                }}
                disabled={isCreating || isAutoSaving}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="primary"
                disabled={isCreating || isAutoSaving}
                onClick={handleSubmit}
              >
                {isCreating ? (
                  <>
                    <span className="spinner-small"></span>
                    Creating...
                  </>
                ) : (
                  'Save Draft'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ArticleFilters;