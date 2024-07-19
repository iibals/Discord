client.on('messageCreate', async (message) => {
  // التأكد من أن الرسالة ليست من البوت نفسه
  if (message.author.bot) return;

  // التحقق إذا كانت الرسالة هي "clear"
  if (message.content.toLowerCase() === '$clear') {
      // محاولة حذف الرسائل
      try {
          let deletedMessages = 0;

          // جلب وحذف الرسائل في أجزاء من 100 حتى نصل إلى 20
          while (deletedMessages < 20 ) { // YOU CAN CHOOSE ANY NUMBER YOU WANT TO DELETE
              const fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
              if (fetchedMessages.size === 0) break;

              for (const msg of fetchedMessages.values()) {
                  await msg.delete();
                  deletedMessages++;

                  // تحقق إذا وصلنا إلى حد 20 رسالة
                  if (deletedMessages >= 20) break;

                  // انتظار فترة قصيرة لتجنب مشاكل المعدل
                  await new Promise(resolve => setTimeout(resolve, 100));
              }
          }

          if (deletedMessages > 1) {
              console.log(`Deleted ${deletedMessages} messages.`);
              message.channel.send(`تم حذف ${deletedMessages} رسالة`+ " استخدم clear$ في اي شات لحذف 20 رسالة متتالية تجنبًا للسبام كرر الطلب في حال تبي تحذف اكثر " );
          } else {
              message.channel.send("سيتم الحذف");
          }
      } catch (error) {
          console.error('Error deleting messages:', error);
          message.channel.send('فيه مشكلة ماقدرت احذف كلم بندر عنها');
      }
  }
});
