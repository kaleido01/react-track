import React, { useState, useContext } from "react";
import { Mutation } from "react-apollo";
import { gql } from "apollo-boost";
import axios from "axios";
import withStyles from "@material-ui/core/styles/withStyles";
import IconButton from "@material-ui/core/IconButton";
import EditIcon from "@material-ui/icons/Edit";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import LibraryMusicIcon from "@material-ui/icons/LibraryMusic";

import Error from "../Shared/Error";
import { GET_TRACKS_QUERY } from "../../pages/App";
import { UserContext } from "./../../Root";

const UpdateTrack = ({ classes, track }) => {
	const currentUser = useContext(UserContext);
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState(track.title);
	const [description, setDescription] = useState(track.description);
	const [file, setFile] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [fileError, setFileError] = useState("");
	const isCurrentUser = currentUser.id === track.postedBy.id;

	const handleAudioChange = event => {
		const selectedFile = event.target.files[0];
		const fileSizeLimit = 10000000;
		if (selectedFile && selectedFile.size > fileSizeLimit) {
			setFileError(`${selectedFile.name}:File size too large`);
		}
		setFile(selectedFile);
		setFileError("");
	};

	const handleAudioUpload = async () => {
		try {
			const data = new FormData();
			data.append("file", file);
			data.append("resource_type", "image");
			data.append("upload_preset", "react-tracks");
			data.append("cloud_name", "da9s05mht");
			const res = await axios.post(
				"https://api.cloudinary.com/v1_1/da9s05mht/image/upload",
				data
			);
			return res.data.url;
		} catch (err) {
			console.error("error uploading file", err);
			setSubmitting(false);
			setOpen(false);
		}
	};

	const handleSubmit = async (event, updateTrack) => {
		event.preventDefault();
		setSubmitting(true);
		const uploadedUrl = await handleAudioUpload();
		updateTrack({
			variables: { trackId: track.id, title, description, url: uploadedUrl }
		});
	};

	return (
		isCurrentUser && (
			<>
				<IconButton onClick={() => setOpen(true)}>
					<EditIcon />
				</IconButton>

				<Mutation
					mutation={UPDATE_TRACK_MUTATION}
					onCompleted={data => {
						setOpen(false);
						setSubmitting(false);
						setTitle("");
						setDescription("");
						setFile("");
					}}
					refetchQueries={() => [{ query: GET_TRACKS_QUERY }]}>
					{(updateTrack, { loading, error }) => {
						if (error) return <Error error={error} />;
						return (
							<Dialog open={open} className={classes.dialog}>
								<form onSubmit={event => handleSubmit(event, updateTrack)}>
									<DialogTitle>Update Track</DialogTitle>
									<DialogContent>
										<DialogContentText>
											add a title, description & Audio File(Under 10mb)
										</DialogContentText>
										<FormControl fullWidth>
											<TextField
												label="Title"
												value={title}
												placeholder="Add Title"
												onChange={event => setTitle(event.target.value)}
												className={classes.TextField}
											/>
										</FormControl>
										<FormControl fullWidth>
											<TextField
												multiline
												rows="2"
												label="Description"
												placeholder="Add Description"
												onChange={event => setDescription(event.target.value)}
												value={description}
												className={classes.TextField}
											/>
										</FormControl>
										<FormControl error={Boolean(fileError)}>
											<input
												id="audio"
												required
												type="file"
												// accept="audio/*"
												onChange={event => handleAudioChange(event)}
												className={classes.input}
											/>
											<label htmlFor="audio">
												<Button
													variant="outlined"
													color={file ? "secondary" : "inherit"}
													component="span"
													className={classes.button}>
													AudioFile
													<LibraryMusicIcon className={classes.icon} />
												</Button>
												{file && file.name}
												<FormHelperText>{fileError}</FormHelperText>
											</label>
										</FormControl>
									</DialogContent>
									<DialogActions>
										<Button
											disabled={submitting}
											onClick={() => {
												setOpen(false);
											}}
											className={classes.cancel}>
											Cancel
										</Button>
										<Button
											disabled={
												submitting ||
												!title.trim() ||
												!description.trim() ||
												!file
											}
											type="submit"
											className={classes.save}>
											{submitting ? (
												<CircularProgress className={classes.save} size={24} />
											) : (
												"Uptate Track"
											)}
										</Button>
									</DialogActions>
								</form>
							</Dialog>
						);
					}}
				</Mutation>
			</>
		)
	);
};

const UPDATE_TRACK_MUTATION = gql`
	mutation($trackId: Int!, $title: String, $description: String, $url: String) {
		updateTrack(
			trackId: $trackId
			title: $title
			description: $description
			url: $url
		) {
			track {
				id
				title
				description
				url
				likes {
					id
				}
				postedBy {
					id
					username
				}
			}
		}
	}
`;

const styles = theme => ({
	container: {
		display: "flex",
		flexWrap: "wrap"
	},
	dialog: {
		margin: "0 auto",
		maxWidth: 550
	},
	textField: {
		margin: theme.spacing.unit
	},
	cancel: {
		color: "red"
	},
	save: {
		color: "green"
	},
	button: {
		margin: theme.spacing.unit * 2
	},
	icon: {
		marginLeft: theme.spacing.unit
	},
	input: {
		display: "none"
	}
});

export default withStyles(styles)(UpdateTrack);
