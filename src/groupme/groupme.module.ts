import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GroupMeService } from './groupme.service';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [HttpModule, MessagesModule],
  providers: [GroupMeService],
  exports: [GroupMeService],
})
export class GroupMeModule {}
