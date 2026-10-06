const getZoomToken = async (accountId, clientId, clientSecret) => {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  const data = await res.json();
  if (!data.access_token) throw new Error("Zoom token failed: " + (data.reason || JSON.stringify(data)));
  return data.access_token;
};

export const createZoomMeeting = async ({ topic, startTime, durationMinutes = 30, accountId, clientId, clientSecret }) => {
  const token = await getZoomToken(accountId, clientId, clientSecret);

  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: topic || "AIFA Free Counselling Call",
      type: 2,
      start_time: startTime,
      duration: durationMinutes,
      timezone: "Asia/Kolkata",
      settings: {
        host_video: true,
        participant_video: true,
        waiting_room: true,
        auto_recording: "none",
      },
    }),
  });

  const data = await res.json();
  if (!data.join_url) throw new Error("Zoom meeting failed: " + JSON.stringify(data));

  return { joinUrl: data.join_url, startUrl: data.start_url, meetingId: data.id, password: data.password };
};

// Parse "15 October 2026" + "10:00am" → ISO string
export const parseBookingDateTime = (dateStr, timeStr) => {
  try {
    if (!dateStr || !timeStr) return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const normalized = timeStr.replace(/(\d+:\d+)(am|pm)/i, (_, t, meridiem) => `${t} ${meridiem.toUpperCase()}`);
    const d = new Date(`${dateStr} ${normalized}`);
    return isNaN(d) ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : d.toISOString();
  } catch {
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
};
