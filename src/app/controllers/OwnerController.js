import Meetup from '../models/Meetup';

class OwnerController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
      order: [['date', 'DESC']],
    });

    return res.json(meetups);
  }
}

export default new OwnerController();
