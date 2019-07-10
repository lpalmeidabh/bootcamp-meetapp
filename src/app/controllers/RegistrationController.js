import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import User from '../models/User';
import Registration from '../models/Registration';
import Queue from '../../lib/Queue';
import RegistrationMail from '../jobs/RegistrationMail';

class RegistrationController {
  async index(req, res) {
    const registrations = await Registration.findAll({
      where: { user_id: req.userId },
      order: ['date', 'DESC'],
      attributes: ['id', 'title', 'description', 'location', 'date', 'past'],
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
        },
      ],
    });

    return res.json(registrations);
  }

  async store(req, res) {
    const meetup = await Meetup.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }],
    });
    const user = await User.findByPk(req.userId);

    if (!meetup) {
      return res.status(400).json({ error: "Meetup doesn't exist" });
    }

    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: "You can't register to meetups you're owner" });
    }

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: "You can't register to past meetups" });
    }

    const isUserAlreadyRegistered = await Registration.findOne({
      where: {
        meetup_id: meetup.id,
        user_id: req.userId,
      },
    });

    if (isUserAlreadyRegistered) {
      return res
        .status(400)
        .json({ error: 'You are already registered to this meetup' });
    }

    const sameDateTimeRegistration = await Registration.findOne({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: { date: meetup.date },
        },
      ],
    });

    if (sameDateTimeRegistration) {
      return res.status(400).json({
        error: 'You are already registered on another meetup at this time',
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

    return res.json(registration);
  }

  // async delete(req, res) {
  //   const meetup = await Meetup.findByPk(req.params.id, {
  //     include: [
  //       {
  //         model: User,
  //         as: 'owner',
  //         attributes: ['name', 'email'],
  //       },
  //     ],
  //   });

  //   if (meetup.user_id !== req.userId) {
  //     return res
  //       .status(401)
  //       .json({ error: "An user can't cancel other user's meetup" });
  //   }

  //   await meetup.delete();
  //   return res.json(re);
  // }
}

export default new RegistrationController();
