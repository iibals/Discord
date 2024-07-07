// This code remove the role and give you another one and choose the days you want do sanction the user

const punishedRoleId = ''; // punishedRoleId
const removedRoleId = ''; // removedRoleId
const policeRoleId = ''; // policeRoleId

client.once('ready', () => {
  console.log('Discord bot is ready!');
  checkPenalties();
});

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('$punish')) {
    const args = message.content.split(' ');
    const member = message.mentions.members.first();
    const days = parseInt(args[2]);

    if (!member || isNaN(days)) {
      message.reply('You have to meintion the user');
      return;
    }

    if (!message.member.roles.cache.has(policeRoleId)) {
      message.reply('You have to be the policeRole ');
      return;
    }

    const botMember = await message.guild.members.fetch(client.user.id);
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
      message.reply('i do not have premissions to do it' );
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    try {
      await member.roles.remove(removedRoleId);
      await member.roles.add(punishedRoleId);

      connection.query(
        'REPLACE INTO penalties (user_id, start_date, end_date, original_role) VALUES (?, ?, ?, ?)',
        [member.id, startDate, endDate, removedRoleId],
        (err, results) => {
          if (err) {
            console.error('Error inserting penalty into the database:', err);
            message.reply('EROR');
            return;
          }
          client.channels.cache.get(channelId).send(`He have been punished ${member} for ${days} Days`);
        }
      );
    } catch (err) {
      console.error('Error updating roles:', err);
      message.reply('حدث خطأ أثناء تحديث الرتب.');
    }
  }

  if (message.content.startsWith('$باقي')) { // for know the remmining days
    const member = message.mentions.members.first();
    if (!member) {
      message.reply('You have to meintion the user');
      return;
    }

    connection.query(
      'SELECT end_date FROM penalties WHERE user_id = ?',
      [member.id],
      (err, results) => {
        if (err) {
          console.error('Error querying the database:', err);
          message.reply('Error querying the database');
          return;
        }
        if (results.length === 0) {
          message.reply('He have to sanctions');
          return;
        }
        const endDate = new Date(results[0].end_date);
        const remainingDays = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
        message.reply(`remaining ${member} ${remainingDays} Days.`);
      }
    );
  }
});

function checkPenalties() {
  schedule.scheduleJob('0 0 * * *', () => {
    connection.query('SELECT * FROM penalties WHERE end_date <= CURDATE()', (err, results) => {
      if (err) {
        console.error('Error querying the database:', err);
        return;
      }
      results.forEach(async (penalty) => {
        const guild = client.guilds.cache.get('466588124387082240'); // استبدل بـ ID سيرفرك
        const member = guild.members.cache.get(penalty.user_id);
        if (member) {
          try {
            await member.roles.add(penalty.original_role);
            await member.roles.remove(punishedRoleId);
            connection.query('DELETE FROM penalties WHERE id = ?', [penalty.id], (err) => {
              if (err) {
                console.error('Error deleting penalty from the database:', err);
              }
              client.channels.cache.get(channelId).send(`${member} is FREE NOW`);
            });
          } catch (err) {
            console.error('Error updating roles:', err);
          }
        }
      });
    });
  });
}