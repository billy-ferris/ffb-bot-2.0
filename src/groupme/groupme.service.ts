import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class GroupMeService {
  private readonly groupMeEndpoint = 'https://api.groupme.com/v3';
  private readonly groupMeBotId =
    this.configService.get<string>('GROUPME_BOT_ID');

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly messagesService: MessagesService,
  ) {}

  async postMessage(message: string) {
    const url = `${this.groupMeEndpoint}/bots/post`;
    const data = {
      bot_id: this.groupMeBotId,
      text: message,
    };
    try {
      await firstValueFrom(this.httpService.post(url, data));
    } catch (error) {
      console.error(error);
    }
  }

  processMessage(msg: { text: string }) {
    const isCommand = this.isCommand(msg.text);

    console.log({ text: msg.text, isCommand });

    if (isCommand) {
      const cmd = this.parseCommand(msg.text);
      void this.executeCommand(cmd);
    }
  }

  private isCommand(text: string) {
    return /^!/.test(text);
  }

  private parseCommand(text: string) {
    const args = text.trim().substring(1).split(/\s+/);
    return args.shift().toLowerCase();
  }

  private async executeCommand(cmd: string) {
    const commands = {
      trade: await this.messagesService.handleTradeBlock(),
    };

    if (cmd in commands) {
      const result = commands[cmd];
      await this.postMessage(result);
    }
  }
}
