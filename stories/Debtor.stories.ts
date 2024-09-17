import type { Meta, StoryObj } from '@storybook/react';

import { Debtor } from './Debtor';

const meta: Meta<typeof Debtor> = {
  title: 'Debtor/Profile',
  component: Debtor,
  // ...
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
