import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Card,
  Flex,
  Text,
} from "@chakra-ui/react";

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
            <Card
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
                <Text size="label.sm" textAlign="center" lineHeight={1.2}>
                  {String(item.trait_type)}
                </Text>
              )}
              <Text size="label.md" textAlign="center" fontWeight="bold">
                {typeof item.value === "object"
                  ? JSON.stringify(item.value || {})
                  : String(item.value || "")}
              </Text>
            </Card>
          ))}
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}
