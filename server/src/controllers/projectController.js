import projectService from '../services/projectService.js';

export const createProject = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    const project = await projectService.createProject({
      workspaceId: req.params.workspaceId,
      name,
      description,
      status,
      userId: req.user._id,
      actor: req.user,
    });
    res.status(201).json({ status: 'success', message: 'Project created successfully', data: { project } });
  } catch (error) { next(error); }
};

export const getWorkspaceProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getWorkspaceProjects(req.params.workspaceId);
    res.status(200).json({ status: 'success', data: { projects } });
  } catch (error) { next(error); }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.workspaceId, req.params.projectId);
    res.status(200).json({ status: 'success', data: { project } });
  } catch (error) { next(error); }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.workspaceId, req.params.projectId, { ...req.body, actor: req.user }, req.user._id);
    res.status(200).json({ status: 'success', message: 'Project updated successfully', data: { project } });
  } catch (error) { next(error); }
};

export const deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.workspaceId, req.params.projectId, req.user._id, req.user);
    res.status(200).json({ status: 'success', message: result.message });
  } catch (error) { next(error); }
};

export default { createProject, getWorkspaceProjects, getProjectById, updateProject, deleteProject };