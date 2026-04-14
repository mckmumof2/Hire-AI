import React, { useState } from 'react';
import { ROLE_CATEGORIES } from '../utils/constants';

const JobListingForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    category: ROLE_CATEGORIES[0],
    department: '',
    description: '',
    location: '',
    salaryRange: '',
    experienceRange: { min: 0, max: 2 },
    requirements: '',
    mandatorySoftware: '',
    preferredSoftware: '',
    status: 'active'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('experienceRange.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        experienceRange: { ...formData.experienceRange, [field]: parseInt(value) }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      requirements: formData.requirements.split('\n').filter(r => r.trim()),
      mandatorySoftware: formData.mandatorySoftware.split(',').map(s => s.trim()).filter(Boolean),
      preferredSoftware: formData.preferredSoftware.split(',').map(s => s.trim()).filter(Boolean)
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="job-form">
      <div className="form-group">
        <label>Job Title</label>
        <input
          type="text"
          className="form-control"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="e.g., Junior Architect, Project Manager"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Category</label>
          <select className="form-control" name="category" value={formData.category} onChange={handleChange}>
            {ROLE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Department</label>
          <input type="text" className="form-control" name="department" value={formData.department} onChange={handleChange} placeholder="e.g., Design Team" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Min Experience (Yrs)</label>
          <input type="number" className="form-control" name="experienceRange.min" value={formData.experienceRange.min} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Max Experience (Yrs)</label>
          <input type="number" className="form-control" name="experienceRange.max" value={formData.experienceRange.max} onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label>Job Description</label>
        <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="Provide a brief overview of the role..."></textarea>
      </div>

      <div className="form-group">
        <label>Mandatory Software (comma separated)</label>
        <input type="text" className="form-control" name="mandatorySoftware" value={formData.mandatorySoftware} onChange={handleChange} placeholder="AutoCAD, Revit, Revit MEP" />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Location</label>
          <input type="text" className="form-control" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., New Delhi" />
        </div>
        <div className="form-group">
          <label>Salary Range</label>
          <input type="text" className="form-control" name="salaryRange" value={formData.salaryRange} onChange={handleChange} placeholder="e.g., 6.0 - 8.0 LPA" />
        </div>
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">{initialData ? 'Update Job' : 'Post Job'}</button>
      </div>
    </form>
  );
};

export default JobListingForm;
