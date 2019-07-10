import { Router } from 'express';
import multer from 'multer';
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import MeetupController from './app/controllers/MeetupController';
import RegistrationController from './app/controllers/RegistrationController';
import OwnerController from './app/controllers/OwnerController';

import multerConfig from './config/multer';
import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

// como as rotas acima estão antes da declaração do middleware, ele nao atua sobre as rotas.
routes.use(authMiddleware);
routes.put('/users', UserController.update);

routes.post('/files', upload.single('file'), FileController.store);

routes.get('/meetups', MeetupController.index);
routes.post('/meetups', MeetupController.store);
routes.put('/meetups/:id', MeetupController.update);
routes.delete('/meetups/:id', MeetupController.delete);
routes.post('/meetups/:id/registrations', RegistrationController.store);
routes.get('/owner', OwnerController.index);
routes.get('/registrations', RegistrationController.index);

export default routes;
