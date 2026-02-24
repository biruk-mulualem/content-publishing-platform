import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/shared/header/Header.jsx";
import "./ArticlesPage.css";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle as deleteArticleService,
  togglePublishStatus,
} from "./services/articleService";

const ArticlesPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUserId = Number(localStorage.getItem("userId"));
  const [articles, setArticles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tagsInput, setTagsInput] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [publishModal, setPublishModal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ title: "", body: "", tags: "" });
  const [editBody, setEditBody] = useState("");
  
  // Field-specific validation errors
  const [titleError, setTitleError] = useState("");
  const [bodyError, setBodyError] = useState("");
  const [tagsError, setTagsError] = useState("");
  const [editTitleError, setEditTitleError] = useState("");
  const [editBodyError, setEditBodyError] = useState("");
  const [editTagsError, setEditTagsError] = useState("");
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  // Autosave states
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState("");
  const autosaveTimerRef = useRef(null);
  const hasChangesRef = useRef(false);
  const createArticleIdRef = useRef(null); // Store ID of newly created article during autosave

  const createQuillRef = useRef(null);
  const editQuillRef = useRef(null);
  const createQuillInstance = useRef(null);
  const editQuillInstance = useRef(null);

  // Helper function to strip HTML and get plain text preview
  const getBodyPreview = (htmlContent, wordCount = 8) => {
    if (!htmlContent) return "No content";
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    
    const words = textContent.trim().split(/\s+/);
    const preview = words.slice(0, wordCount).join(' ');
    
    return words.length > wordCount ? preview + '...' : preview;
  };

  // Helper function to limit tags display
  const getLimitedTags = (tags, limit = 2) => {
    if (!tags || tags.length === 0) return [];
    if (tags.length <= limit) return tags;
    return [...tags.slice(0, limit), `+${tags.length - limit}`];
  };

  // Autosave function for create modal (saves to DB every 30 seconds)
  const autosaveCreateToDB = async () => {
    // Don't autosave if modal is closed, no changes, or already saving
    if (!showModal || !hasChangesRef.current || isAutoSaving || isCreating) return;
    
    // Basic validation - don't autosave if title is empty
    if (!formData.title.trim()) {
      setAutosaveStatus("Title required for save");
      setTimeout(() => setAutosaveStatus(""), 3000);
      return;
    }
    
    // Don't autosave if body is empty
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
      
      // If we already have an ID from a previous autosave, update instead of create
      if (createArticleIdRef.current) {
        createdArticle = await updateArticle(createArticleIdRef.current, newArticleData, token);
        setAutosaveStatus("Auto-saved (updated)");
      } else {
        // First autosave - create new article
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
      
      // Update or add to articles list
      if (createArticleIdRef.current) {
        // Update existing article in the list
        setArticles(prev => prev.map(a => a.id === createArticleIdRef.current ? normalizedArticle : a));
        setFiltered(prev => prev.map(a => a.id === createArticleIdRef.current ? normalizedArticle : a));
      } else {
        // Add new article to the list
        setArticles(prev => [...prev, normalizedArticle]);
        setFiltered(prev => [...prev, normalizedArticle]);
      }
      
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

  // Autosave function for edit modal (saves to DB every 30 seconds)
  const autosaveEditToDB = async () => {
    if (!editModal || !hasChangesRef.current || isAutoSaving || isUpdating) return;
    
    if (!editModal.title.trim()) {
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
    
    // Don't autosave if user doesn't own the article
    if (editModal.authorId !== currentUserId) {
      return;
    }
    
    setIsAutoSaving(true);
    setAutosaveStatus("Auto-saving...");
    
    try {
      const updatedData = {
        title: editModal.title.trim(),
        body: bodyContent,
        tags: tagsInput
      };
      
      const updatedArticle = await updateArticle(editModal.id, updatedData, token);
      
      const normalizedArticle = {
        ...updatedArticle,
        tags: typeof updatedArticle.tags === "string" 
          ? updatedArticle.tags.split(",").map(t => t.trim()).filter(t => t)
          : updatedArticle.tags || [],
        authorName: updatedArticle.authorName || editModal.authorName || "Unknown",
        authorId: updatedArticle.authorId !== undefined ? Number(updatedArticle.authorId) : editModal.authorId,
        bodyPreview: getBodyPreview(bodyContent, 8)
      };
      
      setArticles(prev => prev.map(a => a.id === editModal.id ? normalizedArticle : a));
      setFiltered(prev => prev.map(a => a.id === editModal.id ? normalizedArticle : a));
      
      // Update the editModal with the saved data to keep it in sync
      setEditModal(normalizedArticle);
      
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

  // Track changes in create modal
  useEffect(() => {
    if (showModal) {
      // Reset article ID when opening new create modal
      createArticleIdRef.current = null;
      hasChangesRef.current = true;
    }
  }, [showModal]);

  // Track changes in edit modal
  useEffect(() => {
    if (editModal) {
      hasChangesRef.current = true;
    }
  }, [editModal?.title, tagsInput]);

  // Track Quill content changes for create modal
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

  // Track Quill content changes for edit modal
  useEffect(() => {
    if (editQuillInstance.current) {
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
  }, [editQuillInstance.current]);

  // Set up autosave timer that runs every 30 seconds while modal is open
  useEffect(() => {
    // Clear any existing timer
    if (autosaveTimerRef.current) {
      clearInterval(autosaveTimerRef.current);
    }
    
    // Set up new timer if either modal is open
    if (showModal || editModal) {
      autosaveTimerRef.current = setInterval(() => {
        if (showModal) {
          autosaveCreateToDB();
        } else if (editModal) {
          autosaveEditToDB();
        }
      }, 30000); // 30 seconds
    }
    
    // Cleanup on unmount or when modals close
    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
      }
    };
  }, [showModal, editModal, formData.title, formData.tags, editModal?.title, tagsInput]);

  // Validate create form fields
  const validateCreateFields = () => {
    let isValid = true;
    setTitleError("");
    setBodyError("");
    setTagsError("");
    
    // Title validation
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
    
    // Body validation
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
    
    // TAGS VALIDATION - AT LEAST ONE TAG REQUIRED
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

  // Validate edit form fields
  const validateEditFields = () => {
    let isValid = true;
    setEditTitleError("");
    setEditBodyError("");
    setEditTagsError("");
    
    if (!editModal.title.trim()) {
      setEditTitleError("Title is required.");
      isValid = false;
    } else if (editModal.title.trim().length < 3) {
      setEditTitleError("Title must be at least 3 characters long.");
      isValid = false;
    } else if (editModal.title.trim().length > 200) {
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
    
    if (editModal.authorId !== currentUserId) {
      setError("You don't have permission to edit this article.");
      isValid = false;
    }
    
    return isValid;
  };

  // Fetch articles from backend
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const data = await getArticles(token);

        const normalized = data.map(a => {
          const normalizedArticle = {
            ...a,
            tags:
              typeof a.tags === "string"
                ? a.tags.split(",").map(t => t.trim()).filter(t => t)
                : a.tags || [],
            authorName: a.authorName || "Unknown",
            authorId: Number(a.authorId),
            bodyPreview: getBodyPreview(a.body, 8)
          };

          return normalizedArticle;
        });

        const userArticles = normalized.filter(a => a.authorId === currentUserId);
        
        setArticles(userArticles);
        setFiltered(userArticles);
        setTotalPages(Math.ceil(userArticles.length / itemsPerPage));
        setCurrentPage(1);
      } catch (err) {
        console.error("FETCH ERROR:", err);
        setError("Failed to load articles");
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUserId) {
      fetchArticles();
    }
  }, [token, currentUserId, itemsPerPage]);

  // Filter articles
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
    setTotalPages(Math.ceil(result.length / itemsPerPage));
    setCurrentPage(1);
  }, [search, selectedTag, statusFilter, articles, itemsPerPage]);

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const allTags = ["All", ...new Set(articles.flatMap(a => a.tags))];

  // Initialize Quill for create modal
  useEffect(() => {
    if (showModal && createQuillRef.current) {
      setTimeout(() => {
        if (!createQuillInstance.current) {
          createQuillInstance.current = new Quill(createQuillRef.current, {
            theme: "snow",
            modules: {
              toolbar: [
                [{ list: "ordered" }, { list: "bullet" }],
                ["bold", "italic", "underline"],
                [{ align: [] }],
                ["link", "image"],
                [{ header: [1, 2, 3, 4, 5, 6] }],
              ],
            },
          });
        }
        createQuillInstance.current.root.innerHTML = "";
        setBodyError("");
      }, 100);
    }
  }, [showModal]);

  // Initialize or update Quill whenever editModal changes
  useEffect(() => {
    if (editModal && editQuillRef.current) {
      setTimeout(() => {
        if (!editQuillInstance.current) {
          editQuillInstance.current = new Quill(editQuillRef.current, {
            theme: "snow",
            modules: {
              toolbar: [
                [{ list: "ordered" }, { list: "bullet" }],
                ["bold", "italic", "underline"],
                [{ align: [] }],
                ["link", "image"],
                [{ header: [1, 2, 3, 4, 5, 6] }],
              ],
            },
          });
        }
        
        if (editQuillInstance.current) {
          editQuillInstance.current.root.innerHTML = "";
          editQuillInstance.current.root.innerHTML = editBody || "";
          setEditBodyError("");
        }
      }, 100);
    }
  }, [editModal, editBody]);

  // Create Article
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
      
      // If we already have an ID from autosave, update instead of create
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
      
      // Update or add to articles list
      if (createArticleIdRef.current) {
        setArticles(prev => prev.map(a => a.id === createArticleIdRef.current ? normalizedArticle : a));
        setFiltered(prev => prev.map(a => a.id === createArticleIdRef.current ? normalizedArticle : a));
      } else {
        setArticles(prev => [...prev, normalizedArticle]);
        setFiltered(prev => [...prev, normalizedArticle]);
      }
      
      setFormData({ title: "", body: "", tags: "" });
      setShowModal(false);
      setError("");
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

  // Edit Article
  const saveEdit = async () => {
    setError("");
    
    if (!validateEditFields()) {
      return;
    }
    
    setIsUpdating(true);
    try {
      const bodyContent = editQuillInstance.current?.root?.innerHTML || "";
      
      const updatedData = {
        title: editModal.title.trim(),
        body: bodyContent,
        tags: tagsInput
      };
      
      const updatedArticle = await updateArticle(editModal.id, updatedData, token);
      
      const normalizedArticle = {
        ...updatedArticle,
        tags: typeof updatedArticle.tags === "string" 
          ? updatedArticle.tags.split(",").map(t => t.trim()).filter(t => t)
          : updatedArticle.tags || [],
        authorName: updatedArticle.authorName || editModal.authorName || "Unknown",
        authorId: updatedArticle.authorId !== undefined ? Number(updatedArticle.authorId) : editModal.authorId,
        bodyPreview: getBodyPreview(bodyContent, 8)
      };
      
      setArticles(prev => prev.map(a => a.id === editModal.id ? normalizedArticle : a));
      setFiltered(prev => prev.map(a => a.id === editModal.id ? normalizedArticle : a));
      
      setEditModal(null);
      setError("");
      setEditTitleError("");
      setEditBodyError("");
      setEditTagsError("");
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

  // Delete Article
  const deleteArticleHandler = async (article) => {
    setError("");
    
    if (article.authorId !== currentUserId) {
      setError("You don't have permission to delete this article.");
      setDeleteModal(null);
      return;
    }
    
    if (!article || !article.id) {
      setError("Article not found.");
      setDeleteModal(null);
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteArticleService(article.id, token);
      setArticles(prev => prev.filter(a => a.id !== article.id));
      setFiltered(prev => prev.filter(a => a.id !== article.id));
      setDeleteModal(null);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setError("Article already deleted or not found.");
      } else if (err.response?.status === 403) {
        setError("You don't have permission to delete this article.");
      } else {
        setError("Failed to delete article. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Publish
  const togglePublishHandler = async (article) => {
    setError("");
    
    if (article.authorId !== currentUserId) {
      setError("You don't have permission to modify this article.");
      setPublishModal(null);
      return;
    }
    
    if (!article || !article.id) {
      setError("Article not found.");
      setPublishModal(null);
      return;
    }
    
    if (article.published_status === 0) {
      if (!article.title || article.title.trim().length < 3) {
        setError("Cannot publish: Article title must be at least 3 characters.");
        setPublishModal(null);
        return;
      }
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = article.body || "";
      const textContent = tempDiv.textContent || tempDiv.innerText || "";
      
      if (!textContent.trim() || textContent.trim().length < 10) {
        setError("Cannot publish: Article content must be at least 10 characters.");
        setPublishModal(null);
        return;
      }
      
      if (article.tags && article.tags.length > 0) {
        if (article.tags.length > 10) {
          setError("Cannot publish: Maximum 10 tags allowed.");
          setPublishModal(null);
          return;
        }
        
        for (const tag of article.tags) {
          if (tag.length < 2 || tag.length > 30) {
            setError("Cannot publish: Each tag must be between 2-30 characters.");
            setPublishModal(null);
            return;
          }
        }
      }
    }
    
    setIsTogglingPublish(true);
    try {
      const updatedArticle = await togglePublishStatus(article.id, token);
      
      const normalizedArticle = {
        ...updatedArticle,
        tags: typeof updatedArticle.tags === "string" 
          ? updatedArticle.tags.split(",").map(t => t.trim()).filter(t => t)
          : updatedArticle.tags || [],
        authorName: updatedArticle.authorName || article.authorName,
        authorId: updatedArticle.authorId !== undefined ? Number(updatedArticle.authorId) : article.authorId,
        bodyPreview: article.bodyPreview
      };

      setArticles(prev => prev.map(a => a.id === article.id ? normalizedArticle : a));
      setFiltered(prev => prev.map(a => a.id === article.id ? normalizedArticle : a));
      setPublishModal(null);
    } catch (err) {
      console.error(err);
      setError("Failed to update publish status.");
    } finally {
      setIsTogglingPublish(false);
    }
  };

  // Clean up Quill instances when modals close
  useEffect(() => {
    if (!editModal && editQuillInstance.current) {
      editQuillInstance.current = null;
    }
  }, [editModal]);

  useEffect(() => {
    if (!showModal && createQuillInstance.current) {
      createQuillInstance.current = null;
      createArticleIdRef.current = null;
    }
  }, [showModal]);

  // Loading Spinner Component
  const LoadingSpinner = () => (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Loading your articles...</p>
    </div>
  );

  // Pagination Component
  const Pagination = () => {
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button 
          className="pagination-btn prev"
          onClick={() => {
            setCurrentPage(prev => Math.max(prev - 1, 1));
            document.querySelector('.table-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          disabled={currentPage === 1}
        >
          <span className="btn-icon">←</span>
        </button>
        
        <div className="page-info">
          <span className="current-page">{currentPage}</span>
          <span className="separator">/</span>
          <span className="total-pages">{totalPages}</span>
        </div>
        
        <button 
          className="pagination-btn next"
          onClick={() => {
            setCurrentPage(prev => Math.min(prev + 1, totalPages));
            document.querySelector('.table-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          disabled={currentPage === totalPages}
        >
          <span className="btn-icon">→</span>
        </button>
      </div>
    );
  };

  // Autosave indicator component
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

  if (isLoading) {
    return (
      <div className="dashboard-wrapper">
        <Header />
        <div className="dashboard-layout">
          <main className="dashboard-content">
            <LoadingSpinner />
          </main>
        </div>
      </div>
    );
  }

  if (articles.length === 0 && !error) {
    return (
      <div className="dashboard-wrapper">
        <Header />
        <div className="dashboard-layout">
          <main className="dashboard-content">
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

            {error && <div className="error-message">{error}</div>}

            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p>You haven't created any articles yet.</p>
              <p>Click the "Create Article" button to get started!</p>
            </div>
          </main>
        </div>

        {/* Create Modal with Autosave */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal split-layout">
              <div className="modal-header">
                <h2>Create Article</h2>
                <AutosaveIndicator />
                {error && <p className="error">{error}</p>}
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
                    <p>Use the toolbar above to format your content. You can add headings, lists, links, and images.</p>
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
                    setError("");
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
      </div>
    );
  }

  const currentItems = getCurrentPageItems();

  return (
    <div className="dashboard-wrapper">
      <Header />
      <div className="dashboard-layout">
        <main className="dashboard-content">
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

          {error && <div className="error-message">{error}</div>}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Content Preview</th>
                  <th>Status</th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map(article => {
                    const displayTags = getLimitedTags(article.tags, 2);
                    
                    return (
                      <tr key={article.id}>
                        <td className="title-cell">{article.title}</td>
                        <td className="preview-cell">
                          <div className="content-preview">
                            {article.bodyPreview}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${article.published_status === 1 ? 'published' : 'draft'}`}>
                            {article.published_status === 1 ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td>
                          <div className="tags-container">
                            {displayTags.map((tag, index) => (
                              <span key={index} className={`tag-badge ${tag.startsWith('+') ? 'more-tag' : ''}`}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="actions">
                          <div className="action-buttons">
                            <button
                              className="action-btn detail"
                              onClick={() => navigate(`/articles/${article.id}`)}
                            >
                              <span className="tooltip">Detail</span>
                            </button>

                            <button
                              className="action-btn edit"
                              onClick={() => {
                                setEditModal(article);
                                setTagsInput(article.tags.join(", "));
                                setEditBody(article.body || "");
                                setEditTitleError("");
                                setEditBodyError("");
                                setEditTagsError("");
                                hasChangesRef.current = false;
                              }}
                            >
                              <span className="tooltip">Edit</span>
                            </button>

                            <button
                              className="action-btn delete"
                              onClick={() => {
                                setDeleteModal(article);
                              }}
                            >
                              <span className="tooltip">Delete</span>
                            </button>

                            <button
                              className={`action-btn publish ${article.published_status === 1 ? "unpublish" : "publish-active"}`}
                              onClick={() => {
                                setPublishModal(article);
                              }}
                            >
                              <span className="tooltip">
                                {article.published_status === 1 ? "Unpublish" : "Publish"}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="no-results">
                      <div className="no-results-content">
                        <span className="no-results-icon">🔍</span>
                        <p>No articles found matching your filters</p>
                        <button 
                          className="clear-filters-btn"
                          onClick={() => {
                            setSearch("");
                            setSelectedTag("All");
                            setStatusFilter("All");
                          }}
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination />
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="modal-overlay">
          <div className="modal small">
            <h3>Delete Article</h3>
            
            <div className="modal-content">
              <p>Are you sure you want to delete "<strong>{deleteModal.title}</strong>"?</p>
              <p className="warning-text">This action cannot be undone. The article will be permanently removed.</p>
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => setDeleteModal(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="danger" 
                onClick={() => deleteArticleHandler(deleteModal)}
                disabled={isDeleting}
              >
                {isDeleting ? (
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
      )}

      {/* Publish/Unpublish Confirmation Modal */}
      {publishModal && (
        <div className="modal-overlay">
          <div className="modal small">
            <h3>{publishModal.published_status === 1 ? "Unpublish Article" : "Publish Article"}</h3>
            
            <div className="modal-content">
              <p>
                {publishModal.published_status === 1 
                  ? `Are you sure you want to unpublish "${publishModal.title}"?` 
                  : `Are you sure you want to publish "${publishModal.title}"?`}
              </p>
              <p className="info-text">
                {publishModal.published_status === 1 
                  ? "Unpublished articles will not be visible to readers." 
                  : "Published articles will be visible to all readers."}
              </p>
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => setPublishModal(null)}
                disabled={isTogglingPublish}
              >
                Cancel
              </button>
              <button 
                className="primary" 
                onClick={() => togglePublishHandler(publishModal)}
                disabled={isTogglingPublish}
              >
                {isTogglingPublish ? (
                  <>
                    <span className="spinner-small"></span>
                    {publishModal.published_status === 1 ? 'Unpublishing...' : 'Publishing...'}
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal with Autosave */}
      {editModal && (
        <div className="modal-overlay">
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
                    value={editModal.title} 
                    onChange={e => {
                      setEditModal({ ...editModal, title: e.target.value });
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
                  <p>Use the toolbar above to format your content. You can add headings, lists, links, and images.</p>
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
                  setEditModal(null);
                  setError("");
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
                onClick={saveEdit} 
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
      )}

      {/* Create Modal with Autosave */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal split-layout">
            <div className="modal-header">
              <h2>Create Article</h2>
              <AutosaveIndicator />
              {error && <p className="error">{error}</p>}
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
                  <p>Use the toolbar above to format your content. You can add headings, lists, links, and images.</p>
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
                  setError("");
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
    </div>
  );
};

export default ArticlesPage;