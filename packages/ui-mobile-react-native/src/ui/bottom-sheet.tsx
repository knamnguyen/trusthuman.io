import type { ReactNode } from "react";
import { forwardRef, useCallback, useMemo } from "react";
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
  type BottomSheetProps as GorhomBottomSheetProps,
} from "@gorhom/bottom-sheet";

interface BottomSheetProps extends Partial<GorhomBottomSheetProps> {
  children: ReactNode;
  snapPoints?: string[];
}

const BottomSheet = forwardRef<GorhomBottomSheet, BottomSheetProps>(
  ({ children, snapPoints: snapPointsProp, ...props }, ref) => {
    const snapPoints = useMemo(
      () => snapPointsProp ?? ["75%"],
      [snapPointsProp],
    );

    const renderBackdrop = useCallback(
      (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      ),
      [],
    );

    return (
      <GorhomBottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: "#000000", width: 40 }}
        backgroundStyle={{
          backgroundColor: "#f6f5ee",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderWidth: 2,
          borderColor: "#000000",
        }}
        {...props}
      >
        {children}
      </GorhomBottomSheet>
    );
  },
);
BottomSheet.displayName = "BottomSheet";

export { BottomSheet, BottomSheetScrollView };
export type { BottomSheetProps };
