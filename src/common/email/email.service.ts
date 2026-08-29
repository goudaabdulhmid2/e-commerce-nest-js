import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { verificationEmailTemplate } from './templates/verification-email.template';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  private readonly logger = new Logger(
    EmailService.name,
  );

  constructor(
    private readonly configService: ConfigService,
  ) {
    const options: SMTPTransport.Options = {
      host: this.configService.getOrThrow<string>(
        'MAIL_HOST',
      ),

      port: Number(
        this.configService.getOrThrow<string>(
          'MAIL_PORT',
        ),
      ),

      secure:
        this.configService.getOrThrow<string>(
          'MAIL_SECURE',
        ) === 'true',

      auth: {
        user: this.configService.getOrThrow<string>(
          'MAIL_USER',
        ),

        pass: this.configService.getOrThrow<string>(
          'MAIL_PASSWORD',
        ),
      },
      tls: {
      rejectUnauthorized: false,
            },
    };

    this.transporter =
      nodemailer.createTransport(options);

    this.transporter
      .verify()
      .then(() => {
        this.logger.log(
          'SMTP connection successful',
        );
      })
      .catch((error: unknown) => {
        this.logger.error(
          'SMTP connection failed',
          error,
        );
      });
  }

  async sendOtp(
    email: string,
    otp: string,
  ): Promise<void> {
    this.logger.log(
      `Sending verification email to ${email}`,
    );

    try {
      const info =
        await this.transporter.sendMail({
          from: this.configService.getOrThrow<string>(
            'MAIL_FROM',
          ),
          to: email,
          subject: 'Verify Your Email',
          text: `Your verification code is: ${otp}`,
          html: verificationEmailTemplate(otp),
        });

      this.logger.log(
        `Email sent successfully. Message ID: ${info.messageId}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send email to ${email}`,
        error,
      );

      // Re-throw the error so BullMQ can retry the job.
      throw error;
    }
  }
}