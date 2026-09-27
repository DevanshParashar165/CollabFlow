import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import authService from '../features/auth/authService';
import { createProject, fetchProjects } from '../features/projects/projectSlice';
import { fetchTasks } from '../features/tasks/taskSlice';
import { fetchWorkspaces, setSelectedWorkspaceId } from '../features/workspaces/workspaceSlice';
import ProjectForm from '../features/projects/components/ProjectForm';
import AppIcon from '../components/common/AppIcon';

const EMPTY_PROJECTS = [];

function MetricCard({ label, value, detail, icon, loading = false }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-100" aria-label={`Loading ${label.toLowerCase()}`} />
          ) : (
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
          )}
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700" aria-hidden="true">
          <AppIcon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function RecentProjectCard({ project, workspaceId, tasks }) {
  const completedTasks = tasks?.filter((task) => task.status === 'DONE').length ?? 0;
  const progress = tasks ? (tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0) : null;
  const projectPath = `/workspaces/${workspaceId}/projects/${project._id}`;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:border-indigo-200 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <Link to={projectPath} className="min-w-0 text-sm font-semibold text-slate-900 hover:text-indigo-700">
          <span className="line-clamp-1">{project.name}</span>
        </Link>
        {project.status && <span className="shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">{project.status}</span>}
      </div>
      <p className="mt-2 min-h-10 line-clamp-2 text-sm leading-5 text-slate-600">
        {project.description || 'No description provided.'}
      </p>
      {progress !== null && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-500">Task progress</span>
            <span className="font-medium text-slate-700">{progress}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label={`${project.name} task completion`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className="h-full rounded-full bg-indigo-600 transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">{completedTasks} of {tasks.length} tasks complete</p>
        </div>
      )}
    </article>
  );
}

function EmptyState({ title, message, action }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-5 py-10 text-center">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{message}</p>
      {action}
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const workspaceState = useSelector((state) => state.workspaces);
  const projectState = useSelector((state) => state.projects);
  const taskState = useSelector((state) => state.tasks);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [projectFormError, setProjectFormError] = useState('');
  const [testStatus, setTestStatus] = useState({ loading: false, result: null, statusCode: null, error: false });
  const [failedTaskKeys, setFailedTaskKeys] = useState([]);
  const requestedTaskKeys = useRef(new Set());

  const { workspaces, selectedWorkspaceId, loading: workspacesLoading, error: workspacesError } = workspaceState;
  const activeWorkspaceId = workspaces.some((workspace) => workspace._id === selectedWorkspaceId)
    ? selectedWorkspaceId
    : workspaces[0]?._id || '';
  const selectedWorkspace = workspaces.find((workspace) => workspace._id === activeWorkspaceId);
  const projects = activeWorkspaceId ? projectState.projectsByWorkspace[activeWorkspaceId] : undefined;
  const projectList = projects || EMPTY_PROJECTS;
  const canCreateProject = selectedWorkspace?.role === 'OWNER' || selectedWorkspace?.role === 'ADMIN';

  useEffect(() => {
    if (activeWorkspaceId && activeWorkspaceId !== selectedWorkspaceId) {
      dispatch(setSelectedWorkspaceId(activeWorkspaceId));
    }
  }, [activeWorkspaceId, dispatch, selectedWorkspaceId]);

  useEffect(() => {
    if (activeWorkspaceId && projects === undefined) {
      dispatch(fetchProjects(activeWorkspaceId));
    }
  }, [activeWorkspaceId, dispatch, projects]);

  useEffect(() => {
    if (!activeWorkspaceId || projects === undefined) return;
    projects.forEach((project) => {
      const key = `${activeWorkspaceId}:${project._id}`;
      if (taskState.tasksByProject[key] === undefined && !requestedTaskKeys.current.has(key)) {
        requestedTaskKeys.current.add(key);
        dispatch(fetchTasks({ workspaceId: activeWorkspaceId, projectId: project._id }))
          .unwrap()
          .then(() => setFailedTaskKeys((current) => current.filter((failedKey) => failedKey !== key)))
          .catch(() => setFailedTaskKeys((current) => current.includes(key) ? current : [...current, key]));
      }
    });
  }, [activeWorkspaceId, dispatch, projects, taskState.tasksByProject]);

  const missingTaskProjects = projects?.filter(
    (project) => taskState.tasksByProject[`${activeWorkspaceId}:${project._id}`] === undefined
  ) || [];
  const taskDataLoaded = projects !== undefined && missingTaskProjects.length === 0;
  const allTasks = taskDataLoaded
    ? projects.flatMap((project) => taskState.tasksByProject[`${activeWorkspaceId}:${project._id}`])
    : [];
  const completedTaskCount = allTasks.filter((task) => task.status === 'DONE').length;
  const openTaskCount = allTasks.filter((task) => ['TODO', 'IN_PROGRESS', 'IN_REVIEW'].includes(task.status)).length;
  const recentProjects = useMemo(() => [...projectList]
    .sort((first, second) => {
      const firstDate = first.createdAt ? new Date(first.createdAt).getTime() : 0;
      const secondDate = second.createdAt ? new Date(second.createdAt).getTime() : 0;
      return (Number.isFinite(secondDate) ? secondDate : 0) - (Number.isFinite(firstDate) ? firstDate : 0);
    })
    .slice(0, 6), [projectList]);

  const handleWorkspaceChange = (event) => {
    dispatch(setSelectedWorkspaceId(event.target.value));
  };

  const handleCreateProject = async (projectData) => {
    if (!activeWorkspaceId) return;
    setProjectSubmitting(true);
    setProjectFormError('');
    try {
      await dispatch(createProject({ workspaceId: activeWorkspaceId, projectData })).unwrap();
      setShowProjectForm(false);
    } catch (error) {
      setProjectFormError(typeof error === 'string' ? error : 'Unable to create project. Please try again.');
    } finally {
      setProjectSubmitting(false);
    }
  };

  const retryProjects = () => {
    if (activeWorkspaceId) dispatch(fetchProjects(activeWorkspaceId));
  };

  const retryMissingTasks = () => {
    missingTaskProjects.forEach((project) => {
      const key = `${activeWorkspaceId}:${project._id}`;
      requestedTaskKeys.current.delete(key);
      setFailedTaskKeys((current) => current.filter((failedKey) => failedKey !== key));
      requestedTaskKeys.current.add(key);
      dispatch(fetchTasks({ workspaceId: activeWorkspaceId, projectId: project._id }))
        .unwrap()
        .then(() => setFailedTaskKeys((current) => current.filter((failedKey) => failedKey !== key)))
        .catch(() => setFailedTaskKeys((current) => current.includes(key) ? current : [...current, key]));
    });
  };

  const handleTestAdminRoute = async () => {
    setTestStatus({ loading: true, result: null, statusCode: null, error: false });
    try {
      const response = await authService.testAdminRole();
      setTestStatus({ loading: false, result: response.message || 'Access granted (Admin / Owner role confirmed)', statusCode: 200, error: false });
    } catch (error) {
      setTestStatus({
        loading: false,
        result: error.response?.data?.message || 'Forbidden: Role lacks permission to access this resource.',
        statusCode: error.response?.status || 500,
        error: true,
      });
    }
  };

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';
  const tasksUnavailable = missingTaskProjects.some((project) => failedTaskKeys.includes(`${activeWorkspaceId}:${project._id}`));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="flex flex-col justify-between gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0">
          <p className="text-sm font-medium text-indigo-700">Overview</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Welcome back, {firstName}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {selectedWorkspace ? `A snapshot of ${selectedWorkspace.name}.` : 'Choose a workspace to see your projects and team progress.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {workspaces.length > 0 && (
            <label className="sr-only" htmlFor="dashboard-workspace-select">Selected workspace</label>
          )}
          {workspaces.length > 0 && (
            <select
              id="dashboard-workspace-select"
              value={activeWorkspaceId}
              onChange={handleWorkspaceChange}
              className="h-10 min-w-40 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            >
              {workspaces.map((workspace) => <option key={workspace._id} value={workspace._id}>{workspace.name}</option>)}
            </select>
          )}
          <Link to="/workspaces" className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            View Workspaces
          </Link>
          {canCreateProject && (
            <button type="button" onClick={() => { setProjectFormError(''); setShowProjectForm(true); }} className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
              Create Project
            </button>
          )}
        </div>
      </section>

      {workspacesError && workspaces.length > 0 && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{workspacesError}</span>
          <button type="button" onClick={() => dispatch(fetchWorkspaces())} className="font-medium underline underline-offset-2">Retry</button>
        </div>
      )}

      {workspaces.length === 0 ? (
        workspacesLoading ? (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500" role="status">Loading your workspaces…</div>
        ) : workspacesError ? (
          <EmptyState
            title="Workspaces could not be loaded"
            message={workspacesError}
            action={<button type="button" onClick={() => dispatch(fetchWorkspaces())} className="mt-4 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Retry</button>}
          />
        ) : (
          <EmptyState
            title="No workspaces yet"
            message="Create or join a workspace to see projects and task progress here."
            action={<Link to="/workspaces" className="mt-4 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Go to Workspaces</Link>}
          />
        )
      ) : (
        <>
          {projects !== undefined ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Projects" value={projects.length} detail="In this workspace" icon="folder" />
              {taskDataLoaded ? (
                <>
                  <MetricCard label="Total tasks" value={allTasks.length} detail="Across workspace projects" icon="grid" />
                  <MetricCard label="Completed" value={completedTaskCount} detail="Tasks marked done" icon="check" />
                  <MetricCard label="Pending / in progress" value={openTaskCount} detail="To do, in progress, or review" icon="inbox" />
                </>
              ) : !tasksUnavailable && (
                <>
                  <MetricCard label="Total tasks" detail="Loading task data" icon="grid" loading />
                  <MetricCard label="Completed" detail="Loading task data" icon="check" loading />
                  <MetricCard label="Pending / in progress" detail="Loading task data" icon="inbox" loading />
                </>
              )}
            </div>
          ) : projectState.error ? (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span>{projectState.error}</span>
              <button type="button" onClick={retryProjects} className="font-medium underline underline-offset-2">Retry</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard metrics">
              {[0, 1, 2, 3].map((item) => <MetricCard key={item} label="Loading" value={null} detail="Preparing overview" icon="·" loading />)}
            </div>
          )}

          {tasksUnavailable && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span>Some task totals could not be loaded. Metrics are withheld, and progress appears only for projects whose task lists loaded.</span>
              <button type="button" onClick={retryMissingTasks} className="font-medium underline underline-offset-2">Retry task data</button>
            </div>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recent projects</h2>
                <p className="mt-1 text-xs text-slate-500">Latest projects in {selectedWorkspace?.name || 'this workspace'}</p>
              </div>
              {activeWorkspaceId && projectList.length > 0 && (
                <Link to={`/workspaces/${activeWorkspaceId}/projects`} className="shrink-0 text-sm font-medium text-indigo-700 hover:text-indigo-800">All projects</Link>
              )}
            </div>
            {projects === undefined && !projectState.error ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading projects">
                {[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-lg border border-slate-100 bg-slate-50" />)}
              </div>
            ) : projects === undefined ? (
              <EmptyState title="Projects could not be loaded" message={projectState.error} action={<button type="button" onClick={retryProjects} className="mt-3 text-sm font-medium text-indigo-700">Retry</button>} />
            ) : recentProjects.length ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {recentProjects.map((project) => (
                  <RecentProjectCard
                    key={project._id}
                    project={project}
                    workspaceId={activeWorkspaceId}
                    tasks={taskState.tasksByProject[`${activeWorkspaceId}:${project._id}`]}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No projects in this workspace"
                message="Create a project to start organizing work for your team."
                action={canCreateProject ? <button type="button" onClick={() => setShowProjectForm(true)} className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Create Project</button> : null}
              />
            )}
          </section>
        </>
      )}

      {/* Activity is tracked per task; there is no workspace-level activity feed endpoint in the current client API. */}
      <details className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">Advanced access check</summary>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">Verify the existing role-protected test endpoint for this session.</p>
          <button type="button" id="test-rbac-btn" onClick={handleTestAdminRoute} disabled={testStatus.loading} className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50">
            {testStatus.loading ? 'Checking…' : 'Test access'}
          </button>
          {testStatus.result && (
            <p role="status" className={`w-full text-xs ${testStatus.error ? 'text-amber-800' : 'text-emerald-700'}`}>
              {testStatus.statusCode}: {testStatus.result}
            </p>
          )}
        </div>
      </details>

      {showProjectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" aria-labelledby="dashboard-project-form-title" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="dashboard-project-form-title" className="text-lg font-semibold text-slate-900">Create Project</h2>
              <button type="button" onClick={() => setShowProjectForm(false)} aria-label="Close create project form" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button>
            </div>
            {projectFormError && <p role="alert" className="mb-4 rounded-md border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{projectFormError}</p>}
            <ProjectForm initialProject={null} onSubmit={handleCreateProject} onCancel={() => setShowProjectForm(false)} submitting={projectSubmitting} />
          </div>
        </div>
      )}
    </div>
  );
}
