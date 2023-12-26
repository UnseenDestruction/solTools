import { ReactNode } from "react";
import { classNames } from "../../utils/general";

export default function CreateMintOption({
  active,
  checked,
  children,
}: {
  active: boolean;
  checked: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={classNames(
        "p-2 flex-1 border rounded-md flex items-center justify-center text-sm cursor-pointer hover:-translate-y-2 duration-300",
        active
          ? "bg-purple-600 border-slate-500"
          : "bg-purple-600 border-slate-600",
        checked ? "border-purple-500 text-purple-200" : "text-slate-200"
      )}
    >
      {children}
    </div>
  );
}
