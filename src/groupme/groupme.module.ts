import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GroupMeService } from './groupme.service';

@Module({
  imports: [HttpModule],
  providers: [GroupMeService],
  exports: [GroupMeService],
})
export class GroupMeModule {}
