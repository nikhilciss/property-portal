import type { Email, VerificationCheck } from '../../types';
export interface EmailGateway {
  send(to: string, template: string, entityId: string): Email;
}
export class MockEmailGateway implements EmailGateway {
  send(to: string, template: string, entityId: string): Email {
    return {
      id: crypto.randomUUID(),
      to,
      template,
      entityId,
      date: new Date().toISOString(),
      status: 'Simulated Sent',
    };
  }
}
export interface IdentityVerificationGateway {
  run(result: string): VerificationCheck;
}
export interface CreditCheckGateway {
  run(result: string): VerificationCheck;
}
export interface ComplianceCheckGateway {
  run(result: string): VerificationCheck;
}
class MockCheck {
  constructor(private provider: string) {}
  run(status: string): VerificationCheck {
    const now = new Date().toISOString();
    return {
      provider: this.provider,
      reference: 'DEMO-' + crypto.randomUUID().slice(0, 8),
      status,
      requestedAt: now,
      completedAt: ['Not Started', 'Not Requested', 'Requested', 'Pending', 'Processing'].includes(
        status,
      )
        ? undefined
        : now,
      notes: 'Simulated outcome. No external service was contacted.',
    };
  }
}
export class MockIdentityVerificationGateway
  extends MockCheck
  implements IdentityVerificationGateway
{
  constructor() {
    super('Demo Identity');
  }
}
export class MockCreditCheckGateway extends MockCheck implements CreditCheckGateway {
  constructor() {
    super('Simulated Experian result – Demo');
  }
}
export class MockComplianceCheckGateway extends MockCheck implements ComplianceCheckGateway {
  constructor() {
    super('Demo FCDO compliance');
  }
}
export interface PropertySystemGateway {
  update(id: string): string;
}
export class MockPropertySystemGateway implements PropertySystemGateway {
  update(id: string) {
    return `SAM update simulated for ${id}. No SAM connection.`;
  }
}
