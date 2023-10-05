import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class GroupMeService {
  private readonly groupMeEndpoint = 'https://api.groupme.com/v3';
  private readonly groupMeBotId = '1f4de3f512feb8102757503ae9';

  constructor(private readonly httpService: HttpService) {}

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
