import { differenceInDays, parseISO } from 'date-fns';

interface StatusBadgeProps {
  expirationDate: string;
}

export const StatusBadge = ({ expirationDate }: StatusBadgeProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = parseISO(expirationDate);
  targetDate.setHours(0, 0, 0, 0);

  const diff = differenceInDays(targetDate, today);

  if (diff < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
        期限切れ
      </span>
    );
  } else if (diff === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
        今日まで
      </span>
    );
  } else if (diff <= 3) {
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
        あと{diff}日
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        安全
      </span>
    );
  }
};
