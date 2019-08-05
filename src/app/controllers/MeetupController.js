import * as Yup from 'yup';
import { Op } from 'sequelize';
import { parseISO, isBefore, startOfDay, endOfDay } from 'date-fns';
import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const page = req.query.page || 1;
    const amount = 10;
    const searchDate = req.query.date ? parseISO(req.query.date) : new Date();

    const where = {
      user_id: { [Op.ne]: req.userId },
      date: { [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)] },
    };
    const meetups = await Meetup.findAll({
      where,
      order: ['date'],
      limit: amount,
      offset: (page - 1) * amount,
      attributes: ['id', 'title', 'description', 'location', 'date', 'past'],
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url'],
        },
        User,
      ],
    });

    return res.json(meetups);
  }

  async details(req, res) {
    const meetup = await Meetup.findByPk(req.params.id, {
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url'],
        },
        User,
      ],
    });
    return res.json(meetup);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      banner_id: Yup.number().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(400).json({ error: 'Meetup date invalid' });
    }

    const user_id = req.userId;

    const meetup = await Meetup.create({
      ...req.body,
      user_id,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      banner_id: Yup.number().required(),
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
    });

    if (!schema.isValid(req.body)) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({ error: "Meetup doesn't exist" });
    }

    if (meetup.user_id !== req.userId) {
      return res
        .status(400)
        .json({ error: "You can't update other user's meetup" });
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't update past meetup" });
    }

    await meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({ error: "Meetup doesn't exist." });
    }

    if (meetup.user_id !== req.userId) {
      return res
        .status(400)
        .json({ error: "You can't delete other user's meetup." });
    }

    await meetup.destroy();

    return res.send();
  }
}

export default new MeetupController();
