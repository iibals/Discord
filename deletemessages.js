client.on('messageCreate', async (message) => {
    // التأكد من أن الرسالة ليست من البوت نفسه
    if (message.author.bot) return;

    // التحقق إذا كانت الرسالة هي "clear"
    if (message.content.toLowerCase() === 'clear') { // clear = the message to clear :) you can change it to what ever you want
        // محاولة حذف الرسائل
        try {
            let deletedMessages = 0;

            while (deletedMessages < 2000) { // 2000 messages change to what you want
                const fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
                if (fetchedMessages.size === 0) break;

                await message.channel.bulkDelete(fetchedMessages);
                deletedMessages += fetchedMessages.size;

                // انتظار فترة قصيرة لتجنب مشاكل المعدل
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            if (deletedMessages > 1) {
                console.log(`Deleted ${deletedMessages} messages.`);
                message.channel.send(`تم حذف ${deletedMessages} رسالة`);
            } else {
                message.channel.send("سيتم الحذف");
            }
        } catch (error) {
            console.error('Error deleting messages:', error);
            message.channel.send('فيه مشكلة ماقدرت احذف تأكد ان الرسائل اللي تبي تحذفها اقل من 14 يوم'); // Can't delete message had 14 days old
        }
    }
});