export const money = (amount: number) => '₮' + new Intl.NumberFormat('en-US').format(amount);
