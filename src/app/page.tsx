import Icon from "@/assets/icon.svg";
import { SpinningText } from "@/components/ui/spinning-text";
import Accounts from "./_index/accounts";
import Greet from "./_index/greet";

export default function Page() {
    return (
        <div className="flex flex-col justify-center items-center gap-8">
            <div className="relative flex items-center justify-center w-48 h-48">
                <SpinningText duration={10} reverse={false} radius={5}>
                    e6nlaq • e6nlaq • e6nlaq •
                </SpinningText>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Icon
                        alt="logo"
                        width={48}
                        height={48}
                        className="w-18 h-18"
                    />
                </div>
            </div>

            <Greet />
            <Accounts />
        </div>
    );
}
