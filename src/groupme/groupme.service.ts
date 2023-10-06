import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GroupMeService {
  private readonly groupMeEndpoint = 'https://api.groupme.com/v3';
  private readonly groupMeBotId =
    this.configService.get<string>('GROUPME_BOT_ID');

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
}
