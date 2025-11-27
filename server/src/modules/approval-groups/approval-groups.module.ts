import { Module } from '@nestjs/common';
import { ApprovalGroupsController } from './approval-groups.controller';
import { ApprovalGroupsService } from './approval-groups.service';

@Module({
  controllers: [ApprovalGroupsController],
  providers: [ApprovalGroupsService],
  exports: [ApprovalGroupsService],
})
export class ApprovalGroupsModule {}
