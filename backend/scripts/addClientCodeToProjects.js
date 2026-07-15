import { ensureProjectsSchema } from '../utils/ensureProjectsSchema.js';

ensureProjectsSchema()
  .then(() => {
    console.log('projects.client_code column is ready');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to add client_code to projects:', error);
    process.exit(1);
  });
