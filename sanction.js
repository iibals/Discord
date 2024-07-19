// add and delete role

  const pool = mysql.createPool({
    host: 'DB',
    user: 'user',
    password: '',
    database: 'YOUR_DB',
    connectionLimit: 10 // عدد الاتصالات المسموح بها في وقت واحد
  });

const punishedRoleId = ''; // رتبة مفتاح الملحق
const removedRoleId = ''; // رتبة ملحق العيال
const policeRoleId = ''; // رتبة شرطي
const channelId = 'SELECT_YOU_CHANNEL';
// The rows you need to create is : id, start_date ,end_date ,reason,original_role
client.on('messageCreate', async (message) => {
  if (message.content.startsWith('$عاقب')) {
    const args = message.content.split(' ');
    const member = message.mentions.members.first();
    const reason = args.slice(2).join(' ');

    if (!member || !reason) {
      message.reply('يرجى منشن العضو وذكر سبب العقوبة.');
      return;
    }

    if (!message.member.roles.cache.has(policeRoleId)) {
      message.reply('يجب أن تكون شرطي لتنفيذ هذا الأمر.');
      return;
    }

    const botMember = await message.guild.members.fetch(client.user.id);
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
      message.reply('البوت ليس لديه الأذونات الكافية لإدارة الأدوار.');
      return;
    }

    try {
      pool.getConnection((err, connection) => {
        if (err) {
          console.error('Error getting connection from pool:', err);
          message.reply('حدث خطأ أثناء الاتصال بقاعدة البيانات.');
          return;
        }

        connection.query(
          'SELECT end_date FROM penalties WHERE user_id = ? ORDER BY end_date DESC',
          [member.id],
          async (err, results) => {
            if (err) {
              connection.release();
              console.error('Error querying the database:', err);
              message.reply('حدث خطأ أثناء الاستعلام من قاعدة البيانات.');
              return;
            }

            const penaltyCount = results.length;
            let penaltyDays;

            if (penaltyCount === 0) {
              penaltyDays = 15;
            } else if (penaltyCount === 1) {
              penaltyDays = 30;
            } else {
              const lastPenaltyEndDate = new Date(results[0].end_date);
              const lastPenaltyStartDate = new Date(results[1].end_date);
              const lastPenaltyDuration = Math.ceil((lastPenaltyEndDate - lastPenaltyStartDate) / (1000 * 60 * 60 * 24));
              penaltyDays = lastPenaltyDuration + 15;
            }

            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + penaltyDays);

            await member.roles.remove(removedRoleId);
            await member.roles.add(punishedRoleId);

            connection.query(
              'INSERT INTO penalties (user_id, start_date, end_date, reason, original_role) VALUES (?, ?, ?, ?, ?)',
              [member.id, startDate, endDate, reason, removedRoleId],
              (err, results) => {
                connection.release();
                if (err) {
                  console.error('Error inserting penalty into the database:', err);
                  message.reply('حدث خطأ أثناء تسجيل العقوبة في قاعدة البيانات.');
                  return;
                }

                const penaltyMessage = `تمت معاقبة ${member} لمدة ${penaltyDays} يوم.\n` +
                                       `هذه العقوبة رقم ${penaltyCount + 1}.\n` +
                                       `السبب: ${reason}\n` +
                                       `تنتهي العقوبة في: ${endDate.toLocaleDateString('en-US')}`;

                client.channels.cache.get(channelId).send(penaltyMessage);
                message.reply('تم تنفيذ العقوبة بنجاح.');
              }
            );
          }
        );
      });
    } catch (err) {
      console.error('Error updating roles:', err);
      message.reply('حدث خطأ أثناء تحديث الرتب.');
    }
  }

  if (message.content.startsWith('$معاقبين')) {
    const member = message.mentions.members.first() || message.member;

    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection from pool:', err);
        message.reply('حدث خطأ أثناء الاتصال بقاعدة البيانات.');
        return;
      }

      connection.query(
        'SELECT * FROM penalties WHERE user_id = ? ORDER BY end_date DESC LIMIT 1',
        [member.id],
        (err, results) => {
          connection.release();
          if (err) {
            console.error('Error querying the database:', err);
            message.reply('حدث خطأ أثناء الاستعلام من قاعدة البيانات.');
            return;
          }

          if (results.length === 0) {
            message.reply('لا توجد عقوبات حالية لهذا العضو.');
            return;
          }

          const penalty = results[0];
          const endDate = new Date(penalty.end_date);
          const remainingDays = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

          if (remainingDays > 0) {
            message.reply(`العقوبة الحالية لـ ${member}:\n` +
                          `السبب: ${penalty.reason}\n` +
                          `المدة المتبقية: ${remainingDays} يوم\n` +
                          `تنتهي في: ${endDate.toLocaleDateString('en-US')}`);
          } else {
            message.reply(`لا توجد عقوبات حالية لـ ${member}. آخر عقوبة انتهت.`);
          }
        }
      );
    });
  }
});

function removeExpiredPenalties() {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err);
      return;
    }

    const now = new Date();

    connection.query(
      'SELECT * FROM penalties WHERE end_date <= ?',
      [now],
      async (err, results) => {
        if (err) {
          connection.release();
          console.error('Error querying expired penalties:', err);
          return;
        }

        for (const penalty of results) {
          const guild = client.guilds.cache.first(); // افتراض أن البوت في خادم واحد فقط
          const member = await guild.members.fetch(penalty.user_id).catch(() => null);

          if (member) {
            await member.roles.remove(punishedRoleId);
            await member.roles.add(penalty.original_role);

            client.channels.cache.get(channelId).send(
              `انتهت عقوبة ${member}. تمت إعادة الرتبة الأصلية.`
            );
          }
        }

        connection.release();
      }
    );
  });
}

setInterval(removeExpiredPenalties, 60 * 60 * 1000); // تشغيل كل ساعة
