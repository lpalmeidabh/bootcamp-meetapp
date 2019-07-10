import Sequelize from 'sequelize';

import User from '../app/models/User';
import File from '../app/models/File';
import Meetup from '../app/models/Meetup';
import Registration from '../app/models/Registration';

import mongoose from 'mongoose';

import databaseConfig from '../config/database';

const models = [User, File, Meetup, Registration];

class Database {
  constructor() {
    this.connection = new Sequelize(databaseConfig);

    const mongoURI = process.env.MONGO_URL;

    this.mongoConnection = mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useFindAndModify: true,
    });

    this.init();
    this.associate();
  }

  init() {
    models.forEach(model => model.init(this.connection));
  }

  associate() {
    models.forEach(model => {
      if (model.associate) {
        model.associate(this.connection.models);
      }
    });
  }
}

export default new Database();
