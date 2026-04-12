import {createNavigation} from 'next-intl/navigation';
import {routing} from './routing';

const { Link } = createNavigation(routing);
export default Link;
