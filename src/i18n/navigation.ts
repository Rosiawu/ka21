import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

const {useRouter, usePathname} = createNavigation(routing);

export {useRouter, usePathname};
