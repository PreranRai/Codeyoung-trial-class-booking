export interface EmailDetails {
  parentEmail: string;
  parentName: string;
  parentLocalTimeFormatted: string;
  mentorEmail: string;
  mentorName: string;
  mentorLocalTimeFormatted: string;
  meetingLink: string;
  bookingId: string;
}

export interface EmailService {
  sendBookingConfirmation(details: EmailDetails): Promise<void>;
}

export class ConsoleEmailService implements EmailService {
  async sendBookingConfirmation(details: EmailDetails): Promise<void> {
    const parentBox = `
======================================================================
📧 PARENT CONFIRMATION EMAIL
To: ${details.parentEmail}
Subject: Your Trial Class is Confirmed! (Booking #${details.bookingId.slice(0, 8)})

Hi ${details.parentName},

Your trial class has been successfully booked!

📅 Your Local Date & Time:
${details.parentLocalTimeFormatted}

👨‍🏫 Mentor:
${details.mentorName}

🔗 Join Demo Class Link:
${details.meetingLink}

Thank you for choosing Codeyoung!
======================================================================
`;

    const mentorBox = `
======================================================================
📧 MENTOR NOTIFICATION EMAIL
To: ${details.mentorEmail}
Subject: New Trial Class Assigned (Booking #${details.bookingId.slice(0, 8)})

Hi ${details.mentorName},

You have been assigned a new trial class booking.

👤 Student / Parent:
${details.parentName} (${details.parentEmail})

📅 Your Local Date & Time (Mentor Timezone):
${details.mentorLocalTimeFormatted}

🔗 Class Link:
${details.meetingLink}
======================================================================
`;

    console.log(parentBox);
    console.log(mentorBox);
  }
}
