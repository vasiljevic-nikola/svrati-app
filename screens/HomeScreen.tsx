import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Svrati</Text>

      <Text style={styles.subtitle}>Never forget a place again.</Text>

      <Pressable style={styles.button} onPress={() => setIsModalVisible(true)}>
        <Text style={styles.buttonText}>Add Reminder</Text>
      </Pressable>

      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add new reminder</Text>

            <Text style={styles.modalText}>
              Later, this will open a map and let you choose a location.
            </Text>

            <Pressable
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 42,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 18,
    color: "#CBD5E1",
    textAlign: "center",
    marginBottom: 40,
  },

  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },

  modalText: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
    marginBottom: 24,
  },

  closeButton: {
    backgroundColor: "#0F172A",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
