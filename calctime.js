// Calc the user hours in this join time
const channelId = 'YOUR_CHANNEL_ID'; // choose the chanel want to sent in it
const voiceTimes = new Map();
client.on('voiceStateUpdate', (oldState, newState) => {
    const member = newState.member;
    const userId = member.id;
    const now = new Date();

    // عندما يدخل المستخدم إلى القناة الصوتية
    if (!oldState.channel && newState.channel) {
        voiceTimes.set(userId, now);
        console.log(`${member.user.tag} entered voice channel at ${now}`);
    }

    // عندما يغادر المستخدم القناة الصوتية
    if (oldState.channel && !newState.channel) {
        const joinTime = voiceTimes.get(userId);
        if (joinTime) {
            const leaveTime = now;
            const durationMs = leaveTime - joinTime;

            // تحويل المدة إلى ساعات ودقائق وثواني
            let seconds = Math.floor(durationMs / 1000);
            const hours = Math.floor(seconds / 3600);
            seconds %= 3600;
            const minutes = Math.floor(seconds / 60);
            seconds %= 60;

            const duration = `${hours} ساعة و ${minutes} دقيقة و ${seconds} ثانية`;

            const channel = client.channels.cache.get(channelId);
            if (channel) {
                channel.send(`${member} جلس  ${duration} في السيرفر من يوم دخل  وحي الله من  زار وخفف`);// Count the time
            } else {
                console.error(`Could not find channel with ID ${channelId}`);
            }

            // إزالة المستخدم من القائمة بعد حساب المدة
            voiceTimes.delete(userId);
        }
    }
});