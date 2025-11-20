import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FiImage, FiX, FiSave, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from '../../config/axios.config';
import useCommunityStore from '../../store/useCommunityStore';
import RichTextEditor from '../../components/Community/RichTextEditor';
import TagInput from '../../components/Community/TagInput';

const QuestionForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: editId } = useParams();
  const isEditMode = !!editId;
  const existingQuestion = location.state?.question;
  
  const { createQuestion: storeCreateQuestion, updateQuestion: storeUpdateQuestion } = useCommunityStore();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: []
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const maxTitleLength = 200;
  const maxImageSize = 5 * 1024 * 1024; // 5MB

  // Helper to get plain text length from HTML
  const getTextLength = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent?.trim().length || 0;
  };

  // Fetch question data in edit mode or pre-populate from state
  useEffect(() => {
    const fetchQuestionData = async () => {
      if (isEditMode) {
        if (existingQuestion) {
          // Use data from navigation state
          setFormData({
            title: existingQuestion.title || '',
            content: existingQuestion.content || '',
            tags: existingQuestion.tags || []
          });
          if (existingQuestion.imageUrl) {
            setCurrentImageUrl(existingQuestion.imageUrl);
            setImagePreview(existingQuestion.imageUrl);
          }
        } else {
          // Refetch from API
          setIsLoading(true);
          try {
            const response = await axios.get(`/community/questions/${editId}`);
            if (response.data.success) {
              const q = response.data.question;
              setFormData({
                title: q.title || '',
                content: q.content || '',
                tags: q.tags || []
              });
              if (q.imageUrl) {
                setCurrentImageUrl(q.imageUrl);
                setImagePreview(q.imageUrl);
              }
            }
          } catch (error) {
            console.error('Error fetching question:', error);
            toast.error('Failed to load question data');
            navigate('/app/community');
          } finally {
            setIsLoading(false);
          }
        }
      } else {
        // Load draft for create mode
        const savedData = localStorage.getItem('questionDraft');
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            setFormData(parsed);
          } catch (error) {
            console.error('Error loading draft:', error);
          }
        }
      }
    };

    fetchQuestionData();
  }, [isEditMode, editId, existingQuestion, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.title || formData.content || formData.tags.length > 0) {
        localStorage.setItem('questionDraft', JSON.stringify(formData));
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [formData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length > maxTitleLength) {
      newErrors.title = `Title must not exceed ${maxTitleLength} characters`;
    }

    const contentTextLength = getTextLength(formData.content);
    if (contentTextLength === 0) {
      newErrors.content = 'Content is required';
    } else if (contentTextLength < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    }

    if (image && image.size > maxImageSize) {
      newErrors.image = 'Image must be less than 5MB';
    }

    if (image && !['image/jpeg', 'image/png'].includes(image.type)) {
      newErrors.image = 'Only JPG and PNG images are allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > maxImageSize) {
        toast.error('Image must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Only JPG and PNG images are allowed');
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(currentImageUrl || null);
  };

  const handleRemoveCurrentImage = () => {
    setCurrentImageUrl(null);
    setImagePreview(null);
    setShouldRemoveImage(true);
  };

  const replaceCurrentImage = () => {
    // Trigger file input
    document.getElementById('image-upload-input').click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Edit mode: PUT request
        const response = await axios.put(`/community/questions/${editId}`, {
          title: formData.title.trim(),
          content: formData.content.trim(),
          tags: formData.tags
        });

        if (response.data.success) {
          // Update in store
          storeUpdateQuestion(response.data.question);
          toast.success('Question updated successfully!');
          localStorage.removeItem('questionDraft');
          navigate(`/app/community/${editId}`);
        }
      } else {
        // Create mode: POST request with multipart form data
        const submitData = new FormData();
        submitData.append('title', formData.title.trim());
        submitData.append('content', formData.content.trim());
        submitData.append('tags', JSON.stringify(formData.tags));
        
        if (image) {
          submitData.append('image', image);
        }

        const result = await storeCreateQuestion(submitData);

        if (result.success) {
          toast.success('Question posted successfully!');
          localStorage.removeItem('questionDraft');
          // small delay to ensure store updates propagate before navigation
          setTimeout(() => navigate(`/app/community`), 100);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to post question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (formData.title || formData.content || formData.tags.length > 0) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        localStorage.removeItem('questionDraft');
        navigate('/app/community');
      }
    } else {
      navigate('/app/community');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
            {isEditMode ? 'Edit Question' : 'Ask a Question'}
          </h1>
          <p className="text-gray-600">
            {isEditMode 
              ? 'Update your question details' 
              : 'Share your question with the marine research community'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Question Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What is your question about?"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.title ? 'border-red-500' : 'border-gray-200'
              }`}
              maxLength={maxTitleLength}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.title ? (
                <span className="text-sm text-red-600">{errors.title}</span>
              ) : (
                <span className="text-sm text-gray-500">
                  Be specific and concise
                </span>
              )}
              <span className={`text-sm ${
                formData.title.length > maxTitleLength ? 'text-red-600 font-semibold' : 'text-gray-500'
              }`}>
                {formData.title.length} / {maxTitleLength}
              </span>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Question Details *
            </label>
            <RichTextEditor
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Provide detailed information about your question..."
            />
            {errors.content && (
              <span className="text-sm text-red-600 mt-1 block">{errors.content}</span>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags
            </label>
            <TagInput
              tags={formData.tags}
              onChange={(tags) => setFormData({ ...formData, tags })}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attach Image (Optional)
            </label>
            
            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FiImage size={48} className="text-gray-400 mb-3" />
                  <p className="mb-2 text-sm text-gray-600">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">JPG or PNG (MAX. 5MB)</p>
                </div>
                <input
                  id="image-upload-input"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png"
                  onChange={handleImageChange}
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-96 object-contain rounded-lg border-2 border-gray-200"
                />
                {isEditMode && currentImageUrl && !image ? (
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={replaceCurrentImage}
                      className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
                      aria-label="Replace image"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveCurrentImage}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                      aria-label="Remove image"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    aria-label="Remove image"
                  >
                    <FiX size={20} />
                  </button>
                )}
              </div>
            )}
            {errors.image && (
              <span className="text-sm text-red-600 mt-1 block">{errors.image}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEditMode ? 'Updating...' : 'Posting...'}
                </>
              ) : (
                <>
                  <FiSave size={20} />
                  {isEditMode ? 'Update Question' : 'Post Question'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Draft indicator */}
        {(formData.title || formData.content || formData.tags.length > 0) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            ✨ Your draft is being auto-saved every 30 seconds
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionForm;
