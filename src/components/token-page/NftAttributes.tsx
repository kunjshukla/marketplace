import {
  Box,
  Flex,
  Text,
} from "@chakra-ui/react";
import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
} from "@chakra-ui/accordion";

export function NftAttributes({
  attributes,
}: {
  attributes: Record<string, unknown> | Record<string, unknown>[];
}) {
  /**
   * Assume the NFT attributes follow the conventional format
   */
  // Normalize attributes to array format
  const attributesArray = Array.isArray(attributes) ? attributes : [attributes];
  const items = attributesArray.filter(
    (item: Record<string, unknown>) => item.trait_type
  );
  return (
    <AccordionItem>
      <Text>
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            Traits
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </Text>
      <AccordionPanel pb={4}>
        <Flex direction="row" wrap="wrap" gap="3">
          {items.map((item) => (
            <Box
              key={item.trait_type as string}
              as={Flex}
              flexDir="column"
              gap={2}
              py={2}
              px={4}
              bg={"transparent"}
              border="1px"
            >
              {item.trait_type != null && (
                <Text fontSize="sm" textAlign="center" lineHeight={1.2}>
                  {String(item.trait_type)}
                </Text>
              )}
              <Text textAlign="center" fontWeight="bold">
                {typeof item.value === "object"
                  ? JSON.stringify(item.value || {})
                  : String(item.value || "")}
              </Text>
            </Box>
          ))}
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}
