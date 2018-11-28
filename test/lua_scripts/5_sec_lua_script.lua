print("Get AIN Reading 0.5 seconds for 5 seconds")


MB.W(48005, 0, 1)                       --ensure analog is on

LJ.IntervalConfig(0, 500)              --set interval to 1000 for 1000ms
count=0
while true do
  if LJ.CheckInterval(0) then           --interval completed
    voltage = MB.R(2, 3)                --voltage on AIN1, address is 2, type is 3
    print("AIN1: ", voltage, "V")
    count = count + 1
  end
  if count >= 10 then
    break
  end
end


print("Finished Script")
MB.W(6000, 1, 0);