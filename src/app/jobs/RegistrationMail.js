import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class RegistrationMail {
  get key() {
    return 'CancellationMail';
  }

  async handle({ data }) {
    const { meetup, user } = data;
    console.log('Queue executed');
    await Mail.sendMail({
      to: `${meetup.owner.name} <${meetup.owner.email}>`,
      subject: 'Novo usuário registrado',
      template: 'registration',
      context: {
        owner_name: meetup.owner.name,
        user_name: user.name,
        user_email: user.email,
        date: format(parseISO(meetup.date), "dd 'de' MMMM', às' H:mm", {
          locale: pt,
        }),
      },
    });
  }
}

export default new RegistrationMail();

// o usuario importar a classe
// import CancellationMail from '..'
// Conseguirá acessar CancellationMail.key
