import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

import Registration from '../models/Registration';
import Queue from '../../lib/Queue';
import RegistrationMail from '../jobs/RegistrationMail';

class RegistrationController {
  async index(req, res) {
    const registrations = await Registration.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          include: [
            {
              model: File,
              as: 'banner',
              attributes: ['id', 'path', 'url'],
            },
            User,
          ],

          required: true,
        },
      ],
      order: [[Meetup, 'date']],
    });

    return res.json(registrations);
  }

  async store(req, res) {
    const meetup = await Meetup.findByPk(req.params.id, {
      include: [User],
    });
    const user = await User.findByPk(req.userId);

    if (!meetup) {
      return res.status(400).json({ error: 'A meetup não existe' });
    }

    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: 'Você não pode registrar em suas próprias meetups' });
    }

    if (meetup.past) {
      return res.status(400).json({
        error: 'Você não pode registrar em meetups que já aconteceram.',
      });
    }

    const checkDate = await Registration.findOne({
      where: {
        user_id: user.id,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    const isUserAlreadyRegistered = await Registration.findOne({
      where: {
        meetup_id: meetup.id,
        user_id: req.userId,
      },
    });

    if (isUserAlreadyRegistered) {
      return res
        .status(400)
        .json({ error: 'Você já está registrado nesta meetup' });
    }

    if (checkDate) {
      return res.status(400).json({
        error: 'Você ja está registrado em outra meetup neste mesmo horário',
      });
    }

    const registration = await Registration.create({
      meetup_id: meetup.id,
      user_id: req.userId,
    });

    await Queue.add(RegistrationMail.key, {
      meetup,
      user,
    });

    console.log(registration);
    return res.json(registration);
  }

  async delete(req, res) {
    const registration = await Registration.findOne({
      where: {
        user_id: req.userId,
        meetup_id: req.params.id,
      },
    });

    if (registration.user_id !== req.userId) {
      return res.status(401).json({
        error:
          'Você não pode cancelar a inscrição de outro usuario em uma meetup',
      });
    }

    await registration.destroy();
    return res.send();
  }
}

export default new RegistrationController();
