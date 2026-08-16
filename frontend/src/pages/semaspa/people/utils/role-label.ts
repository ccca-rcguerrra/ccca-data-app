export function personRoleI18nKey(role: string): string {
  switch (role) {
    case 'PROPRIETARIO':
      return 'semaspa.people.roles.owner';
    case 'RESPONSAVEL_TECNICO':
      return 'semaspa.people.roles.technicalResponsible';
    case 'ANALISTA':
      return 'semaspa.people.roles.analyst';
    case 'ORIGEM_GF':
      return 'semaspa.people.roles.origin';
    case 'DESTINO_GF':
      return 'semaspa.people.roles.destination';
    default:
      return '';
  }
}
