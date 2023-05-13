/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Text,
  Group,
  Stack,
  TextInput,
  Button,
  Textarea,
  Grid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";

import { FileUpload, UploadedImage } from "@/app/components";
import { useAppSelector } from "@/redux/hooks";
import {
  MemoryMediaUploadType,
  API,
  DeletePhotoReturnType,
} from "@/api-config/API";

const MemoryCreate = () => {
  const { user, token, isAuth } = useAppSelector(
    (state) => state.authentication
  );
  const [images, setImages] = useState<MemoryMediaUploadType[]>([]);
  const [isLoading, setIsLoading] = useState({ isLoading: false, id: "" });
  const route = useRouter();

  const form = useForm({
    initialValues: {
      title: "",
      slug: "",
      body: "",
      street: "",
      city: "",
      state: "",
      country: "",
      zip: "",
    },

    validate: {
      title: (val) =>
        val.length > 120
          ? "Title is too long, must not greater than 120 characters. got " +
            val.length +
            "characters"
          : null,
      body: (val) =>
        val.length < 120
          ? "Description is too short, please add some text at least 120 characters."
          : null,
    },
  });

  const deletePhoto = async (photoName: string) => {
    console.log("🔥🔥🔥 delete photo id", photoName);
    setIsLoading({ isLoading: true, id: photoName });
    try {
      const { data } = await API.delete<DeletePhotoReturnType>(
        `/api/v1/memories/delete-photo?photoName=${photoName}`,
        { headers: { authorization: `Bearer ${user?.token}` } }
      );
      if (data.success) {
        setImages((prev) => prev.filter((x) => x.filename !== data.photoName));
        notifications.show({
          title: "🚀 Memory Creation information 🔥",
          message: "Successfully photo deleted",
          color: "orange",
        });
      }
    } catch (error: any) {
      let err_message;
      if (error instanceof AxiosError) {
        err_message = error.response?.data.message;
      } else {
        err_message = error.message;
      }
      notifications.show({
        title: "🚀 Memory Creation information 🔥",
        message: err_message,
        color: "yellow",
      });
    } finally {
      setIsLoading({ isLoading: false, id: "" });
    }
  };

  useEffect(() => {
    if (!user || !token || !isAuth) {
      route.replace("/");
    }
  }, [isAuth, route, token, user]);

  return (
    <Container size="sm" mt={50}>
      <Paper radius="md" p="xl" withBorder>
        <Text size="lg" weight={500} mb={20}>
          Welcome to Memory, Create a new memory.
        </Text>

        <form
          onSubmit={form.onSubmit((data) => {
            console.log(data);
          })}
        >
          <Stack>
            <TextInput
              label="Memory Title"
              placeholder="What is your memory title?"
              value={form.values.title}
              onChange={(event) =>
                form.setFieldValue("title", event.currentTarget.value)
              }
              radius="md"
              required
              error={form.errors.title}
            />

            <TextInput
              required
              label="Slug"
              placeholder="Slug will generate automatically"
              value={form.values.slug}
              onChange={(event) =>
                form.setFieldValue("slug", event.currentTarget.value)
              }
              error={form.errors.slug && "Invalid slug"}
              radius="md"
            />

            <Text fw={500} mb={-15}>
              Place of memory
            </Text>
            <Grid>
              <Grid.Col xs={8}>
                <TextInput
                  description="Street"
                  placeholder="Ex: Holding #65, Wall Street"
                  value={form.values.street}
                  onChange={(event) =>
                    form.setFieldValue("street", event.currentTarget.value)
                  }
                  error={form.errors.street && "Invalid slug"}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col xs={4}>
                <TextInput
                  description="Zip Code"
                  placeholder="Ex: 4560"
                  value={form.values.zip}
                  onChange={(event) =>
                    form.setFieldValue("zip", event.currentTarget.value)
                  }
                  error={form.errors.zip && "Invalid slug"}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col xs={4}>
                <TextInput
                  description="City"
                  placeholder="Ex: Dhaka"
                  value={form.values.city}
                  onChange={(event) =>
                    form.setFieldValue("city", event.currentTarget.value)
                  }
                  error={form.errors.city && "Invalid slug"}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col xs={4}>
                <TextInput
                  description="State"
                  placeholder="Ex: Khulna"
                  value={form.values.state}
                  onChange={(event) =>
                    form.setFieldValue("state", event.currentTarget.value)
                  }
                  error={form.errors.state && "Invalid slug"}
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col xs={4}>
                <TextInput
                  description="Country"
                  placeholder="Ex: Bangladesh"
                  value={form.values.country}
                  onChange={(event) =>
                    form.setFieldValue("country", event.currentTarget.value)
                  }
                  error={form.errors.country && "Invalid slug"}
                  radius="md"
                />
              </Grid.Col>
            </Grid>

            <Textarea
              placeholder="Write some description about your memory."
              label="Description"
              error={form.errors.body}
              radius="md"
              withAsterisk
              required
              value={form.values.body}
              onChange={(event) =>
                form.setFieldValue("body", event.currentTarget.value)
              }
              minRows={10}
            />

            {/* TODO: file upload */}
            {user && (
              <>
                <Text size="md" weight={500} mb={-10}>
                  Upload your memory photos: max 5 images
                </Text>
                <FileUpload
                  user={user}
                  setImages={setImages}
                  imagesLength={images.length}
                />
              </>
            )}
            {/* TODO: uploaded images */}
            {images.length > 0 && (
              <>
                <Text size="md" weight={500} mb={-5}>
                  Uploaded images
                </Text>
                <UploadedImage
                  images={images}
                  deletePhoto={deletePhoto}
                  isLoading={isLoading}
                />
              </>
            )}
          </Stack>

          <Group position="apart" mt="xl">
            <Button type="button" radius="md" variant="outline" color="yellow">
              Cancel
            </Button>
            <Button type="submit" radius="md">
              Create New
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
};

export default MemoryCreate;
