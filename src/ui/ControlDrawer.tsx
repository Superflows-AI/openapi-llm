import { FC, useState, useContext } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Heading,
  useToast,
  Tooltip,
  HStack,
  Switch,
} from "@chakra-ui/react";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import Select, { MultiValue } from "react-select";
import makeAnimated from "react-select/animated";
import ControlDynamic from "./ControlDynamic";
import ControlConfig from "./ControlConfig";
import ControlDescripton from "./ControlDescription"
import Context from "./context";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const animatedComponents = makeAnimated();

const bMinusA = (a: Set<string>, b: Array<string>) =>
  b.filter((x) => !a.has(x));
type MultiValueType = MultiValue<{ value: string; label: string }>;

const ControlDrawer: FC<Props> = ({ isOpen, onClose }) => {
  const context = useContext(Context);

  // Endpoint selection logic
  const [showPathParameters, setShowPathParameters] = useState(true);

  const toast = useToast();
  const hosts = Array.from(context.allHosts);
  hosts.sort();
  const enabledHosts = bMinusA(context.disabledHosts, hosts);
  const value = Array.from(enabledHosts).map((host) => ({
    label: host,
    value: host,
  }));

  const onChange = (valuesLabels: MultiValueType) => {
    if (valuesLabels.length === 0) {
      toast({
        title: "Could not apply.",
        description: "You must select at least one host.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    const values = valuesLabels.map(({ value }) => value);
    const disabledHosts = new Set(bMinusA(new Set(values), hosts));
    context.setDisabledHosts(disabledHosts);
  };

  const options: Array<{ value: string; label: string }> = hosts.map(
    (host) => ({ value: host, label: host })
  );

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Settings</DrawerHeader>

        <DrawerBody>
          <ControlConfig />
          <Heading as="h2" size="sm" marginBottom="1em" marginTop="1em">
            Filter Hosts
          </Heading>
          <Select
            onChange={onChange}
            value={value}
            options={options}
            isMulti
            name="colors"
            className="basic-multi-select"
            classNamePrefix="select"
            components={animatedComponents}
          />
          <HStack justifyContent="space-between">
          <ControlDescripton />
          </HStack>
          <HStack justifyContent="space-between" alignItems="center">
            <Heading as="h2" size="sm" margin="1em 0">
              Set Path Parameters
              <Switch isChecked={showPathParameters} onChange={() => setShowPathParameters(!showPathParameters)} />
            </Heading>
            {showPathParameters && <ControlDynamic />}
              <Tooltip
                label="Click on a part in a pathname to make it a path parameter. I.e. in /posts/1, /posts/2, click 1 or 2 to create a single endpoint /posts/:param1. This is a one way operation."
                placement="left"
              >
              <InfoOutlineIcon />
            </Tooltip>
          </HStack>
          <ControlDynamic />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default ControlDrawer;
